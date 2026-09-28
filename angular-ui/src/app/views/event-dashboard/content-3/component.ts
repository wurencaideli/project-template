import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    OnDestroy,
    OnInit,
    ViewChild,
    inject,
    signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { use, graphic } from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, LegendComponent } from 'echarts/components';

import { DashboardService, type CommonData } from '../service';
import { ApiService } from '../../../service/api.service';
import { delay, deepClone } from '../../../utils/common.utils';
import { rootCauseMap, getI18nName_1 } from '../i18n-mapping';
import { SvgIconComponent } from '../../../components/svg-icon/component';
import { DefineChartComponent } from '../../../components/define-chart/component';
import { HeadCpComponent } from '../head/component';

use([BarChart, GridComponent, LegendComponent]);

interface Filter {
    label: string;
    active: boolean;
    startMoment?: Date;
    endMoment?: Date;
}
interface ApiStatus {
    loading: boolean;
    res: Array<{ type: string; count: number }>;
    error: string;
}

/**
 * 根因分类统计:今日 / 本周 / 本月 三段切换,柱状图。
 * subscription 自动随 destroy 清理;状态全部 signal。
 */
@Component({
    selector: 'content-3-cp',
    standalone: true,
    imports: [SvgIconComponent, DefineChartComponent, HeadCpComponent],
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Content3CpComponent implements OnInit, OnDestroy {
    private readonly translateService = inject(TranslateService);
    private readonly dashboardService = inject(DashboardService);
    private readonly apiService = inject(ApiService);
    private readonly destroyRef = inject(DestroyRef);

    readonly serviceCommonData = signal<CommonData>(this.dashboardService.commonData);
    readonly options = signal<unknown>({});
    readonly filters = signal<Filter[]>([]);
    readonly apiStatus = signal<ApiStatus>({ loading: false, res: [], error: '' });
    readonly title = signal(this.translateService.instant('content3_title'));
    readonly retryLabel = signal(this.translateService.instant('content4_retry'));
    readonly refreshLabel = signal(this.translateService.instant('content3_refresh'));

    @ViewChild(DefineChartComponent) chartRef?: DefineChartComponent;
    private chartClickBound = false;

    constructor() {
        this.initFilters();
        this.dashboardService.commonDataChanged
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                void this.initData();
            });
    }

    ngOnInit(): void {
        // 已在构造函数中初始化,这里保留 OnInit 钩子
    }

    ngOnDestroy(): void {
        // takeUntilDestroyed handles teardown automatically.
    }

    async ngAfterViewInit(): Promise<void> {
        await delay(16);
        await this.initData();
    }

    private initFilters(): void {
        this.filters.set([
            { label: this.translateService.instant('content3_filter_today'), active: true },
            { label: this.translateService.instant('content3_filter_week'), active: false },
            { label: this.translateService.instant('content3_filter_month'), active: false },
        ]);
    }

    /** 接收 chart 实例并绑定 click,点击柱条打开对应 rootCause 的事件详情对话框 */
    onChartInit(chartInstance: unknown): void {
        const inst = chartInstance as
            | {
                  on: (
                      event: string,
                      cb: (params: { data?: { type?: string } }) => void,
                  ) => void;
              }
            | null;
        if (!inst || this.chartClickBound) return;
        this.chartClickBound = true;
        inst.on('click', (params) => {
            let type: string | string[] | undefined = params?.data?.type;
            if (!type) return;
            const active = this.filters().find((f) => f.active);
            const start = active?.startMoment?.getTime?.();
            const end = active?.endMoment?.getTime?.();
            if (type === 'OTHERS') {
                const seriesData: Array<{ type?: string }> =
                    ((this.options() as { series?: Array<{ data?: Array<{ type?: string }> }> })
                        ?.series?.[0]?.data as Array<{ type?: string }>) || [];
                const others = new Set(
                    seriesData
                        .map((d) => d?.type)
                        .filter((t): t is string => !!t && t !== 'OTHERS'),
                );
                const options: Array<{ value: string }> =
                    (
                        this.dashboardService.commonData.configData.opevents as unknown as Record<
                            string,
                            { options?: Array<{ value: string }> } | undefined
                        >
                    )?.['rootNetworkType']?.options || [];
                type = options
                    .filter((item) => !Array.from(others).includes(item.value))
                    .map((item) => item.value);
            } else {
                type = [type as string];
            }
            this.dashboardService.showInfo({
                formData: {
                    rootNetworkType: type,
                    raisedTime_start: start,
                    raisedTime_end: end,
                },
            });
        });
    }

    private async initData(): Promise<void> {
        const oldServiceCommonData = deepClone(this.serviceCommonData());
        this.serviceCommonData.set(deepClone(this.dashboardService.commonData));
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

    private async getData(): Promise<void> {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        const dayOfWeek = weekStart.getDay() || 7;
        weekStart.setDate(weekStart.getDate() - (dayOfWeek - 1));
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const updated: Filter[] = this.filters().map((f, i) => {
            if (i === 0) return { ...f, startMoment: today, endMoment: now };
            if (i === 1) return { ...f, startMoment: weekStart, endMoment: now };
            return { ...f, startMoment: monthStart, endMoment: now };
        });
        this.filters.set(updated);
        const active = updated.find((f) => f.active);
        if (!active || !active.startMoment || !active.endMoment) return;
        const apiStatus: ApiStatus = { loading: true, res: [], error: '' };
        this.apiStatus.set(apiStatus);
        await this.apiService
            .rootCauseStatistics({
                filter: [
                    {
                        column: 'app',
                        value: 'EventGPT',
                        relation: '=',
                    },
                ],
                startTime: active.startMoment.getTime(),
                endTime: active.endMoment.getTime(),
            })
            .then((res: { result?: ApiStatus['res'] }) => {
                apiStatus.res = res.result || [];
                if (apiStatus.res.length == 0) {
                    apiStatus.error = this.translateService.instant('dashboard_data_empty');
                }
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

    async selectFilter(item: Filter): Promise<void> {
        this.filters.set(this.filters().map((f) => ({ ...f, active: f.label === item.label })));
        await this.getData();
        this.initChartOptions();
    }

    initChartOptions(): void {
        const scale = this.dashboardService.scalingFactor;
        const seriesList = this.apiStatus().res || [];
        const xAxisData = seriesList.map((item) =>
            getI18nName_1(rootCauseMap, item.type, this.translateService.currentLang || ''),
        );
        const barGradientStops = [
            { offset: 0, color: '#3B69FF' },
            { offset: 1, color: '#4B97FA' },
        ];
        const gradient = new graphic.LinearGradient(0, 0, 0, 1, barGradientStops);
        const barData = seriesList.map((item) => ({
            value: item.count ?? 0,
            type: item.type,
            itemStyle: {
                color: gradient,
                borderRadius: [6 * scale, 6 * scale, 0, 0],
            },
        }));
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
                show: false,
                orient: 'horizontal',
                top: 0,
                right: 0,
                itemWidth: 10 * scale,
                itemHeight: 10 * scale,
                itemGap: 16 * scale,
                icon: 'rect',
                textStyle: { color: '#94a3b8', fontSize: 14 * scale },
            },
            grid: {
                left: 36 * scale,
                right: 12 * scale,
                top: 15 * scale,
                bottom: 24 * scale,
            },
            xAxis: {
                type: 'category',
                boundaryGap: true,
                data: xAxisData,
                axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.25)' } },
                axisTick: { show: false },
                nameShow: true,
                axisLabel: {
                    color: '#94a3b8',
                    fontSize: 14 * scale,
                    interval: 0,
                    hideOverlap: false,
                    formatter: (val: string): string =>
                        val.length > 15 ? val.substring(0, 15) + '...' : val,
                },
            },
            yAxis: {
                type: 'value',
                scale: true,
                min: 0,
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: { color: '#94a3b8', fontSize: 16 * scale },
                splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)' } },
            },
            series: [
                {
                    name: this.translateService.instant('content3_series_count'),
                    type: 'bar',
                    barMaxWidth: 24 * scale,
                    barGap: '30%',
                    minBarHeight: 2 * scale,
                    data: barData,
                },
            ],
        });
    }
}
