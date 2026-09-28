import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    OnDestroy,
    ViewChild,
    inject,
    signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent } from 'echarts/components';

import { DashboardService, type CommonData } from '../service';
import { ApiService } from '../../../service/api.service';
import { delay, deepClone } from '../../../utils/common.utils';
import { timestampToStr } from '../../../utils/date.util';
import { getI18nName_1, leaveMap } from '../i18n-mapping';
import { SvgIconComponent } from '../../../components/svg-icon/component';
import { DefineChartComponent } from '../../../components/define-chart/component';
import { HeadCpComponent } from '../head/component';

// 本页面用到的图表类型按需注册
use([LineChart, GridComponent, LegendComponent]);

interface FormState {
    startMoment: Date | null;
    endMoment: Date | null;
    startMinDate: Date | null;
    startMaxDate: Date | null;
    endMinDate: Date | null;
    endMaxDate: Date | null;
    startPlaceholder: string;
    endPlaceholder: string;
}
interface ApiStatus {
    loading: boolean;
    res: Array<{ day: string; totalCount?: number; filteredCount?: number }>;
    error: string;
}

/**
 * Level 01 告警统计区块:总事件 + Level 01 双系列折线。
 * 状态全部用 signal;subscription 用 takeUntilDestroyed 自动清理。
 */
@Component({
    selector: 'content-2-cp',
    standalone: true,
    imports: [CommonModule, SvgIconComponent, DefineChartComponent, HeadCpComponent],
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Content2CpComponent implements OnDestroy {
    private readonly translateService = inject(TranslateService);
    private readonly dashboardService = inject(DashboardService);
    private readonly apiService = inject(ApiService);
    private readonly destroyRef = inject(DestroyRef);

    readonly serviceCommonData = signal<CommonData>(this.dashboardService.commonData);
    readonly options = signal<unknown>({});
    readonly form = signal<FormState>({
        startMoment: null,
        endMoment: null,
        startMinDate: null,
        startMaxDate: null,
        endMinDate: null,
        endMaxDate: null,
        startPlaceholder: this.translateService.instant('content2_start_placeholder'),
        endPlaceholder: this.translateService.instant('content2_end_placeholder'),
    });
    readonly apiStatus = signal<ApiStatus>({ loading: false, res: [], error: '' });
    readonly title = signal(this.translateService.instant('content2_title'));
    readonly retryLabel = signal(this.translateService.instant('content4_retry'));
    readonly refreshLabel = signal(this.translateService.instant('content2_refresh'));
    readonly today = new Date();

    @ViewChild(DefineChartComponent) chartRef?: DefineChartComponent;
    private chartClickBound = false;

    constructor() {
        this.dashboardService.commonDataChanged
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                void this.initData();
            });
    }

    ngOnDestroy(): void {
        // takeUntilDestroyed handles teardown automatically.
    }

    async ngAfterViewInit(): Promise<void> {
        await delay(16);
        await this.initData();
    }

    /** 接收 chart 实例并绑定 click,根据 seriesIndex 区分 totalCount / filteredCount */
    onChartInit(chartInstance: unknown): void {
        const inst = chartInstance as
            | {
                  on: (
                      event: string,
                      cb: (params: { seriesIndex?: number; name?: string }) => void,
                  ) => void;
              }
            | null;
        if (!inst || this.chartClickBound) return;
        this.chartClickBound = true;
        inst.on('click', (params) => {
            if (!params || (params.seriesIndex !== 0 && params.seriesIndex !== 1)) return;
            const formData: Record<string, unknown> = {};
            if (params.seriesIndex === 1) {
                formData['level'] = ['01'];
            }
            const clickedDay = params.name;
            if (clickedDay) {
                const parts = String(clickedDay)
                    .split('-')
                    .map((v) => parseInt(v, 10));
                if (parts.length >= 3 && !parts.some((n) => Number.isNaN(n))) {
                    const clickedDate = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
                    const endOfDay = new Date(clickedDate);
                    endOfDay.setHours(23, 59, 59, 999);
                    formData['raisedTime_start'] = clickedDate.getTime();
                    formData['raisedTime_end'] = endOfDay.getTime();
                }
            }
            this.dashboardService.showInfo({ formData });
        });
    }

    private async initData(): Promise<void> {
        this.form.update((f) => ({ ...f, startMaxDate: new Date() }));
        const oldServiceCommonData = deepClone(this.serviceCommonData());
        this.serviceCommonData.set(deepClone(this.dashboardService.commonData));
        const cur = this.serviceCommonData();
        if (cur.refreshNumber > (oldServiceCommonData.refreshNumber || 0)) {
            if (!this.form().startMoment) {
                await this.onStartChange({ date: this.getSevenDaysAgo() });
            } else {
                await this.getData();
            }
            this.initChartOptions();
        }
        if (
            cur.viewSizeChangeNumber >
            (oldServiceCommonData.viewSizeChangeNumber || 0)
        ) {
            this.initChartOptions();
        }
    }

    private getSevenDaysAgo(): Date {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    parseDateInput(value: string | Date): Date {
        if (value instanceof Date) return value;
        if (!value) return new Date(NaN);
        const parts = String(value).split('-').map((v) => parseInt(v, 10));
        if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return new Date(NaN);
        return new Date(parts[0]!, parts[1]! - 1, parts[2]!);
    }

    async onStartChange(value: { date: Date }): Promise<void> {
        const startDate = value.date;
        const minEnd = new Date(startDate);
        minEnd.setDate(minEnd.getDate() + 1);
        const maxEnd = new Date(startDate);
        maxEnd.setDate(maxEnd.getDate() + 30);
        const sevenDayEnd = new Date(startDate);
        sevenDayEnd.setDate(sevenDayEnd.getDate() + 7);
        const endMoment =
            sevenDayEnd.getTime() > this.today.getTime() ? this.today : sevenDayEnd;
        this.form.set({
            ...this.form(),
            startMoment: startDate,
            endMinDate: minEnd,
            endMaxDate: maxEnd.getTime() > this.today.getTime() ? this.today : maxEnd,
            endMoment,
        });
        await this.getData();
        this.initChartOptions();
    }

    async onEndChange(value: { date: Date }): Promise<void> {
        this.form.update((f) => ({ ...f, endMoment: value.date }));
        await this.getData();
        this.initChartOptions();
    }

    private async getData(): Promise<void> {
        const f = this.form();
        if (!(f.startMoment instanceof Date) || !(f.endMoment instanceof Date)) return;
        const apiStatus: ApiStatus = { loading: true, res: [], error: '' };
        this.apiStatus.set(apiStatus);
        await this.apiService
            .countStatistics({
                filter: [
                    {
                        column: 'level',
                        value: '01',
                        relation: '=',
                    },
                ],
                startDay: timestampToStr(f.startMoment.getTime(), 'YYYY-MM-DD'),
                endDay: timestampToStr(f.endMoment.getTime(), 'YYYY-MM-DD'),
            })
            .then((res: { result?: ApiStatus['res'] }) => {
                apiStatus.res = res.result || [];
            })
            .catch(() => {
                apiStatus.error = this.translateService.instant('dashboard_api_error');
            });
        apiStatus.loading = false;
        this.apiStatus.set({ ...apiStatus });
    }

    async retryFetch(): Promise<void> {
        await this.getData();
        this.initChartOptions();
    }

    initChartOptions(): void {
        const seriesList = this.apiStatus().res || [];
        const scale = this.dashboardService.scalingFactor;
        const palette = [
            { line: '#00E676', area: 'rgba(0, 230, 118, 0.7)' },
            { line: '#f14040', area: 'rgba(241, 64, 64, 0.7)' },
            { line: '#1993ff', area: 'rgba(25, 147, 255, 0.7)' },
            { line: '#FFB020', area: 'rgba(255, 176, 32, 0.7)' },
        ];
        const xAxisData = seriesList.map((item) => item.day);
        const valueKeys: Array<keyof ApiStatus['res'][number]> = ['totalCount', 'filteredCount'];
        const legendNames = [
            this.translateService.instant('content1_total'),
            getI18nName_1(leaveMap, '01', this.translateService.currentLang || ''),
        ];
        this.options.set({
            tooltip: {
                trigger: 'axis',
                appendTo: this.dashboardService.dashboardBody,
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                borderColor: 'rgba(148, 163, 184, 0.2)',
                borderWidth: 1 * scale,
                padding: [8 * scale, 12 * scale],
                textStyle: { color: '#e2e8f0', fontSize: 16 * scale },
                axisPointer: {
                    type: 'line',
                    lineStyle: { color: 'rgba(148, 163, 184, 0.5)' },
                },
            },
            backgroundColor: 'transparent',
            legend: {
                orient: 'horizontal',
                top: 0,
                right: 0,
                itemWidth: 10 * scale,
                itemHeight: 10 * scale,
                itemGap: 16 * scale,
                icon: 'circle',
                data: legendNames,
                textStyle: { color: '#94a3b8', fontSize: 14 * scale },
            },
            grid: {
                left: 36 * scale,
                right: 12 * scale,
                top: 40 * scale,
                bottom: 24 * scale,
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: xAxisData,
                axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.25)' } },
                axisTick: { show: false },
                axisLabel: { color: '#94a3b8', fontSize: 16 * scale },
            },
            yAxis: {
                type: 'value',
                scale: true,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { color: '#94a3b8', fontSize: 16 * scale },
                splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)' } },
            },
            series: valueKeys.map((key, index) => {
                const color = palette[index % palette.length]!;
                return {
                    name: legendNames[index],
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 8 * scale,
                    lineStyle: { color: color.line, width: 3 * scale },
                    itemStyle: {
                        color: color.line,
                        borderColor: 'rgba(15, 23, 42, 0.8)',
                        borderWidth: 2 * scale,
                    },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [
                                { offset: 0, color: color.area },
                                { offset: 1, color: 'rgba(0, 0, 0, 0)' },
                            ],
                        },
                    },
                    data: seriesList.map((item) => item[key] ?? 0),
                };
            }),
        });
    }
}
