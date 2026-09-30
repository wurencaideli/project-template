import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { use, graphic } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import { DashboardService } from '../service';
import { ApiService } from '../../../service/api.service';
import { debounce, delay, deepClone } from '../../../utils/common.utils';
import { DefineChartComponent } from '../../../components/define-chart/component';
use([LineChart, GridComponent]);
/** 汇总统计接口返回约定:卡片 N 的数值对应 numberN,说明文字对应 textN,走势数组对应 chartN */
interface SummaryStatisticsResult {
    number1?: number;
    number2?: number;
    number3?: number;
    number4?: number;
    chart1?: number[];
    chart2?: number[];
    chart3?: number[];
    chart4?: number[];
    text1?: string;
    text2?: string;
    text3?: string;
    text4?: string;
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
    options: unknown;
}
interface FormState {
    startMoment: Date;
    endMoment: Date;
}
/**
 * 仪表盘顶部统计卡片(模板规范):标题为「标题N」占位,数值取接口返回的 numberN,说明文字取 textN。
 * - apiStatus 是普通属性,每次请求换新对象,回调对比引用丢弃过期响应(竞态保护)
 * - 页面展示状态(loading/error)与卡片数据走 signal,订阅用 takeUntilDestroyed
 */
@Component({
    selector: 'top-cp',
    standalone: true,
    imports: [DefineChartComponent],
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopCpComponent {
    private readonly translateService = inject(TranslateService);
    private readonly dashboardService = inject(DashboardService);
    private readonly apiService = inject(ApiService);
    private readonly destroyRef = inject(DestroyRef);
    /** 初始为空对象:首次 initData 时新旧计数必然不等,保证首屏拉数 */
    serviceCommonData: any = {};
    readonly cardList = signal<CardItem[]>([]);
    apiStatus: ApiStatus = { loading: false, res: {}, error: '' };
    /** 页面展示的加载状态:apiStatus 更新后从中取值刷入 */
    readonly loadState = signal({ loading: false, error: '' });
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
        this.cardList.set(
            [1, 2, 3, 4].map((id) => ({
                id,
                title: `测试组件标题${id}`,
                number: '0',
                text: '--',
                options: {},
            })),
        );
    }
    private async initData(): Promise<void> {
        // 旧值就是上一份私有深拷贝,直接引用比较计数;只需深拷贝 service 最新数据
        const oldServiceCommonData = this.serviceCommonData;
        this.serviceCommonData = deepClone(this.dashboardService.commonData);
        const cur = this.serviceCommonData;
        if (cur.refreshNumber > (oldServiceCommonData.refreshNumber || 0)) {
            this.retryFetch();
        }
        if (cur.viewSizeChangeNumber > (oldServiceCommonData.viewSizeChangeNumber || 0)) {
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
        this.apiStatus = apiStatus;
        this.loadState.set({ loading: this.apiStatus.loading, error: this.apiStatus.error });
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
            .then((res: { data?: SummaryStatisticsResult }) => {
                apiStatus.res = res.data || {};
            })
            .catch(() => {
                apiStatus.error = this.translateService.instant('dashboard_api_error');
            });
        apiStatus.loading = false;
        this.loadState.set({ loading: this.apiStatus.loading, error: this.apiStatus.error });
    }
    /** 刷新连点/emit 突发时合并为一次「拉取+重绘」(150ms) */
    retryFetch = debounce(async () => {
        await this.getData();
        this.initChartOptions();
    }, 150);
    /** 根据数据渲染卡片:numberN / textN / chartN 按卡片 id 对应 */
    initChartOptions(): void {
        const data: any = this.apiStatus.res || {};
        this.cardList.set(
            this.cardList().map(
                (card): CardItem => ({
                    ...card,
                    number: String(data[`number${card.id}`] ?? 0),
                    text: data[`text${card.id}`] ?? '--',
                    options: this.getChartOptions(data[`chart${card.id}`] ?? []),
                }),
            ),
        );
    }
    /** 迷你折线图(模板规范):走势直接取接口返回的 chartN 序列 */
    private getChartOptions(points: number[]): unknown {
        const scale = this.dashboardService.scalingFactor;
        return {
            grid: { left: 0, right: 0, top: 5 * scale, bottom: 0 },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                show: false,
                data: points.map((_, i) => `${i}`),
            },
            yAxis: { type: 'value', show: false, scale: true },
            series: [
                {
                    type: 'line',
                    data: points,
                    smooth: true,
                    symbol: 'none',
                    lineStyle: { width: 3 * scale, color: '#ff8c00' },
                    areaStyle: {
                        color: new graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(255, 140, 0, 0.4)' },
                            { offset: 1, color: 'rgba(255, 140, 0, 0)' },
                        ]),
                    },
                },
            ],
        };
    }
    /** 查看详情 */
    showInfo() {
        this.dashboardService.showInfo();
    }
}
