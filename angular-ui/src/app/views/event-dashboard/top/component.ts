import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    inject,
    signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

import { DashboardService, type CommonData } from '../service';
import { ApiService } from '../../../service/api.service';
import { delay } from '../../../utils/common.utils';

interface SummaryStatisticsResult {
    eventSummary?: { recentCount?: number; ratio?: number | null };
    level1Summary?: { totalLevel1Count?: number; currentLevel1Count?: number };
    dispatchSummary?: { currentEventCount?: number; dispatchedCount?: number };
    durationSummary?: { avgClearMinutes?: number; diffMinutes?: number | null };
}
interface ApiStatus {
    loading: boolean;
    res: SummaryStatisticsResult;
    error: string;
}
interface CardItem {
    id: number;
    title: string;
    number: string;
    text: string;
    unit?: string;
    options: unknown;
}
interface FormState {
    startMoment: Date;
    endMoment: Date;
}
/** 单击/双击触发的查询参数配置 */
interface ClickAction {
    formData?: (form: FormState) => Record<string, unknown> | undefined;
    other?: Record<string, unknown>;
}
type ActionTable = Record<number, ClickAction | undefined>;

/**
 * 仪表盘顶部四张统计卡片:总事件数、level 1 数、当前处理中、平均处理时长。
 * - 全部状态用 signal,订阅走 takeUntilDestroyed
 * - 卡片数据由 signal 数组驱动模板,OnPush + zoneless 安全
 */
@Component({
    selector: 'top-cp',
    standalone: true,
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopCpComponent {
    private readonly translateService = inject(TranslateService);
    private readonly dashboardService = inject(DashboardService);
    private readonly apiService = inject(ApiService);
    private readonly destroyRef = inject(DestroyRef);

    readonly serviceCommonData = signal<CommonData>(this.dashboardService.commonData);
    readonly cardList = signal<CardItem[]>([]);
    readonly apiStatus = signal<ApiStatus>({ loading: false, res: {}, error: '' });
    readonly form = signal<FormState>({
        startMoment: this.get24HoursAgo(),
        endMoment: new Date(),
    });
    /** 重试按钮文本,初始化时从 i18n 取一次;语言切换不在此处重新计算 */
    readonly retryLabel = this.translateService.instant('content4_retry');

    constructor() {
        this.initCardList();
        this.dashboardService.commonDataChanged
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                void this.initData();
            });
    }

    async ngAfterViewInit(): Promise<void> {
        await delay(16);
        await this.initData();
    }

    private initCardList(): void {
        this.cardList.set([
            {
                id: 1,
                title: this.translateService.instant('top_total_title'),
                number: '0',
                text: '--',
                options: {},
            },
            {
                id: 2,
                title: this.translateService.instant('top_level1_title'),
                number: '0',
                text: '--',
                options: {},
            },
            {
                id: 3,
                title: this.translateService.instant('top_current_title'),
                number: '0',
                text: '--',
                options: {},
            },
            {
                id: 4,
                title: this.translateService.instant('top_avg_duration_title'),
                number: '0',
                text: '--',
                options: {},
            },
        ]);
    }

    private async initData(): Promise<void> {
        // 只快照引用,不深拷贝——refreshNumber / viewSizeChangeNumber 是基本类型,
        // service 数据由 service 自己负责不可变,这里信任它。
        const oldServiceCommonData = this.serviceCommonData();
        this.serviceCommonData.set(this.dashboardService.commonData);
        const cur = this.serviceCommonData();
        if (cur.refreshNumber > (oldServiceCommonData.refreshNumber || 0)) {
            await this.getData();
            this.initChartOptions();
        }
        if (
            cur.viewSizeChangeNumber >
            (oldServiceCommonData.viewSizeChangeNumber || 0)
        ) {
            this.initChartOptions();
        }
    }

    private get24HoursAgo(): Date {
        const date = new Date();
        date.setHours(date.getHours() - 24);
        return date;
    }

    /** 获取异步数据 */
    private async getData(): Promise<void> {
        this.form.set({
            startMoment: this.get24HoursAgo(),
            endMoment: new Date(),
        });
        const apiStatus: ApiStatus = { loading: true, res: {}, error: '' };
        this.apiStatus.set(apiStatus);
        await this.apiService
            .summaryStatistics({
                filter: [
                    {
                        column: 'app',
                        value: 'EventGPT',
                        relation: '=',
                    },
                ],
                startTime: this.form().startMoment.getTime(),
                endTime: this.form().endMoment.getTime(),
            })
            .then((res: { result?: SummaryStatisticsResult }) => {
                apiStatus.res = res.result || {};
            })
            .catch(() => {
                apiStatus.error = this.translateService.instant('dashboard_api_error');
            });
        apiStatus.loading = false;
        this.apiStatus.set({ ...apiStatus });
    }

    /** 重新请求卡片数据 */
    async retryFetch(): Promise<void> {
        await this.getData();
        this.initChartOptions();
    }

    /** 根据数据渲染卡片(全量不可变重建) */
    initChartOptions(): void {
        const data = this.apiStatus().res || {};
        const eventSummary = data.eventSummary || {};
        const level1Summary = data.level1Summary || {};
        const dispatchSummary = data.dispatchSummary || {};
        const durationSummary = data.durationSummary || {};
        const pendingTemplate = this.translateService.instant('top_pending');
        const dispatchedTemplate = this.translateService.instant('top_dispatched');
        const hourUnit = ` ${this.translateService.instant('hour')}`;
        const avgClearMinutes = Number(durationSummary.avgClearMinutes) || 0;

        this.cardList.set(
            this.cardList().map((card): CardItem => {
                switch (card.id) {
                    case 1:
                        return {
                            ...card,
                            number: String(eventSummary.recentCount || 0),
                            text: this.formatRatioText(eventSummary.ratio),
                        };
                    case 2:
                        return {
                            ...card,
                            number: String(level1Summary.totalLevel1Count || 0),
                            text: `${pendingTemplate} ${level1Summary.currentLevel1Count || 0}`,
                        };
                    case 3:
                        return {
                            ...card,
                            number: String(dispatchSummary.currentEventCount || 0),
                            text: `${dispatchedTemplate} ${dispatchSummary.dispatchedCount || 0}`,
                        };
                    case 4:
                        return {
                            ...card,
                            number: `${(avgClearMinutes / 60).toFixed(1)}`,
                            unit: hourUnit,
                            text: this.formatDurationText(durationSummary.diffMinutes),
                        };
                    default:
                        return card;
                }
            }),
        );
    }

    private formatRatioText(ratio: number | null | undefined): string {
        if (!ratio && ratio !== 0) return this.translateService.instant('top_compare_empty');
        if (ratio === 0) return this.translateService.instant('top_compare_equal');
        const percent = Math.abs(ratio * 100).toFixed(1);
        const template = this.translateService.instant(
            ratio > 0 ? 'top_compare_increase' : 'top_compare_decrease',
        );
        return template.replace('{{percent}}', percent);
    }

    private formatDurationText(diffMinutes: number | null | undefined): string {
        if (!diffMinutes && diffMinutes !== 0)
            return this.translateService.instant('top_compare_empty');
        if (diffMinutes === 0)
            return this.translateService.instant('top_compare_duration_equal');
        const hours = (Math.abs(diffMinutes) / 60).toFixed(1);
        const template = this.translateService.instant(
            diffMinutes < 0 ? 'top_compare_duration_shorter' : 'top_compare_duration_longer',
        );
        return template.replace('{{hours}}', hours);
    }

    onTitleClick(item: CardItem): void {
        this.handleAction(item, PRIMARY_ACTIONS);
    }

    onTitleClickSecondary(item: CardItem): void {
        this.handleAction(item, SECONDARY_ACTIONS);
    }

    private handleAction(item: CardItem, table: ActionTable): void {
        const config = table[item?.id];
        if (!config?.formData) return;
        const formData = config.formData(this.form());
        if (!formData) return;
        this.dashboardService.showInfo({
            formData,
            ...(config.other ?? {}),
        });
    }
}

/**
 * 单击卡片标题触发的查询参数。按 id 索引;id=4(平均处理时长)无动作,索引留空。
 */
const rangeAction =
    () =>
    (form: FormState): Record<string, unknown> => ({
        raisedTime_start: form.startMoment.getTime(),
        raisedTime_end: form.endMoment.getTime(),
    });
const level1RangeAction =
    () =>
    (form: FormState): Record<string, unknown> => ({
        level: ['01'],
        raisedTime_start: form.startMoment.getTime(),
        raisedTime_end: form.endMoment.getTime(),
    });
const emptyAction = () => (): Record<string, unknown> => ({});
const currentEventOther = {
    hiddenOtherType: true,
    eventType: 'CURRENT',
} as const;

const PRIMARY_ACTIONS: ActionTable = {
    1: { formData: rangeAction() },
    2: { formData: level1RangeAction(), other: currentEventOther },
    3: { formData: emptyAction(), other: currentEventOther },
};

const SECONDARY_ACTIONS: ActionTable = {
    2: { formData: level1RangeAction(), other: currentEventOther },
    3: { formData: () => ({ orderId_1_2: true }), other: currentEventOther },
};
