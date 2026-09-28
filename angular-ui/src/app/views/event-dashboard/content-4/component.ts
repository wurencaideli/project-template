import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    OnDestroy,
    inject,
    signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { use, graphic } from 'echarts/core';
import { BarChart, PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';

import { DashboardService, type CommonData } from '../service';
import { ApiService } from '../../../service/api.service';
import { delay, deepClone } from '../../../utils/common.utils';
import { getI18nName_1, leaveMap, processMap } from '../i18n-mapping';
import { SvgIconComponent } from '../../../components/svg-icon/component';
import { DefineChartComponent } from '../../../components/define-chart/component';
import { HeadCpComponent } from '../head/component';
import { ChartHeadCpComponent } from '../chart-head/component';

use([BarChart, PieChart, GridComponent, LegendComponent, TooltipComponent]);

interface SubApiStatus {
    loading: boolean;
    res: unknown[];
    error: string;
}
interface DataItem {
    id: number;
    title: string;
    options: unknown;
    apiStatus: SubApiStatus;
}

const INITIAL_SUB_STATUS: SubApiStatus = { loading: false, res: [], error: '' };

/**
 * 仪表盘底部三宫格:过程阶段 / 等级 / 类型 三个分类统计。
 * - 第一项占位,接口暂未启用;后两项真实拉取。
 * - subscription 用 takeUntilDestroyed 自动清理。
 */
@Component({
    selector: 'content-4-cp',
    standalone: true,
    imports: [SvgIconComponent, DefineChartComponent, HeadCpComponent, ChartHeadCpComponent],
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Content4CpComponent implements OnDestroy {
    private readonly translateService = inject(TranslateService);
    private readonly dashboardService = inject(DashboardService);
    private readonly apiService = inject(ApiService);
    private readonly destroyRef = inject(DestroyRef);

    readonly serviceCommonData = signal<CommonData>(this.dashboardService.commonData);
    readonly dataList = signal<DataItem[]>([]);
    readonly title = signal(this.translateService.instant('content4_title'));
    readonly retryLabel = signal(this.translateService.instant('content4_retry'));
    readonly refreshLabel = signal(this.translateService.instant('content4_refresh'));

    constructor() {
        this.initDataList();
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

    private initDataList(): void {
        this.dataList.set([
            {
                id: 1,
                title: this.translateService.instant('content4_stage_title'),
                options: {},
                apiStatus: { ...INITIAL_SUB_STATUS },
            },
            {
                id: 2,
                title: this.translateService.instant('content4_level_title'),
                options: {},
                apiStatus: { ...INITIAL_SUB_STATUS },
            },
            {
                id: 3,
                title: this.translateService.instant('content4_type_title'),
                options: {},
                apiStatus: { ...INITIAL_SUB_STATUS },
            },
        ]);
    }

    /** 接收 chart 实例并按 item.id 绑定 click */
    onChartInit(item: DataItem, chartInstance: unknown): void {
        const id = item?.id;
        if (id == null) return;
        const inst = chartInstance as
            | {
                  on: (
                      event: string,
                      cb: (params: { data?: { type?: string; level?: string; eventName?: string } }) => void,
                  ) => void;
              }
            | null;
        if (!inst) return;
        inst.on('click', (params) => {
            const data = params?.data || {};
            const formData: Record<string, unknown> = {};
            if (id === 1) {
                return;
            }
            if (id === 2 && data.level) formData['level'] = [data.level];
            if (id === 3 && data.eventName) formData['name'] = data.eventName;
            if (Object.keys(formData).length === 0) return;
            this.dashboardService.showInfo({
                formData,
                hiddenOtherType: true,
                eventType: 'CURRENT',
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

    private getSevenDaysAgo(): Date {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    private async getData(): Promise<void> {
        await Promise.all([this.getData_1(), this.getData_2(), this.getData_3()]);
    }

    private async getData_1(): Promise<void> {
        // 阶段分布接口暂未启用,占位即可
        return;
    }

    private async getData_2(): Promise<void> {
        const apiStatus: SubApiStatus = { loading: true, res: [], error: '' };
        this.updateItem(1, (item) => ({ ...item, apiStatus }));
        await this.apiService
            .eventCurrentLevelStatistics({ filter: [] })
            .then((res: { result?: unknown[] }) => {
                apiStatus.res = res.result || [];
            })
            .catch(() => {
                apiStatus.error = this.translateService.instant('dashboard_api_error');
            });
        apiStatus.loading = false;
        this.updateItem(1, (item) => ({ ...item, apiStatus: { ...apiStatus } }));
    }

    private async getData_3(): Promise<void> {
        const apiStatus: SubApiStatus = { loading: true, res: [], error: '' };
        this.updateItem(2, (item) => ({ ...item, apiStatus }));
        await this.apiService
            .currentTypeStatistics({
                eventNames: [
                    '5G CELL DOWN',
                    '4G CELL DOWN',
                    '2G CELL DOWN',
                    'PSD',
                    'CSD',
                    'MULTI SITE DOWN',
                    '5G Site Down',
                    '4G Site Down',
                    '2G Site Down',
                ],
            })
            .then((res: { result?: unknown[] }) => {
                apiStatus.res = res.result || [];
            })
            .catch(() => {
                apiStatus.error = this.translateService.instant('dashboard_api_error');
            });
        apiStatus.loading = false;
        this.updateItem(2, (item) => ({ ...item, apiStatus: { ...apiStatus } }));
    }

    private updateItem(index: number, fn: (item: DataItem) => DataItem): void {
        const next = [...this.dataList()];
        const cur = next[index];
        if (!cur) return;
        next[index] = fn(cur);
        this.dataList.set(next);
    }

    async retryFetch(index: number): Promise<void> {
        const fetcherMap: Array<() => Promise<void>> = [
            this.getData_1.bind(this),
            this.getData_2.bind(this),
            this.getData_3.bind(this),
        ];
        const fetcher = fetcherMap[index];
        if (fetcher) {
            await fetcher();
            this.initChartOptions();
        }
    }

    async refreshAll(): Promise<void> {
        await this.getData();
        this.initChartOptions();
    }

    initChartOptions(): void {
        this.updateItem(0, (item) => ({ ...item, options: this.getStageDistributionOptions() }));
        this.updateItem(1, (item) => ({ ...item, options: this.getLevelDistributionOptions() }));
        this.updateItem(2, (item) => ({ ...item, options: this.getTypeStatisticsOptions() }));
    }

    /** 处理过程阶段分布(占位,接口暂未启用) */
    private getStageDistributionOptions(): unknown {
        const data = (this.dataList()[0]?.apiStatus?.res as Array<{
            type: string;
            count: number;
        }>) || [];
        const scale = this.dashboardService.scalingFactor;
        const palette = [
            '#1993ff',
            '#00E676',
            '#FFB020',
            '#FF5C5C',
            '#8C6BFF',
            '#00C4D4',
            '#FF8A3D',
            '#5CB85C',
            '#E05CC8',
            '#FFD54F',
        ];
        const lang = this.translateService.currentLang || '';
        const seriesData = data.map((item, index) => ({
            name: getI18nName_1(processMap, item.type, lang),
            type: item.type,
            value: item.count ?? 0,
            itemStyle: { color: palette[index % palette.length] },
        }));
        const total = data.reduce((sum, item) => sum + (item.count ?? 0), 0);
        const finalSeriesData = seriesData.length
            ? seriesData
            : [
                  {
                      value: 1,
                      name: '',
                      itemStyle: { color: 'rgba(148, 163, 184, 0.2)' },
                      emphasis: { disabled: true },
                      label: { show: false },
                      labelLine: { show: false },
                      tooltip: { show: false },
                  },
              ];
        return {
            tooltip: {
                trigger: 'item',
                appendTo: this.dashboardService.dashboardBody,
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                borderColor: 'rgba(148, 163, 184, 0.2)',
                borderWidth: 1 * scale,
                padding: [8 * scale, 12 * scale],
                textStyle: { color: '#e2e8f0', fontSize: 14 * scale },
                formatter: '{b}: {c} ({d}%)',
            },
            backgroundColor: 'transparent',
            graphic: [
                {
                    type: 'group',
                    left: '35%',
                    top: '50%',
                    bounding: 'raw',
                    children: [
                        {
                            type: 'text',
                            top: -16,
                            style: {
                                text: this.translateService.instant('dashboard_total'),
                                textAlign: 'center',
                                textVerticalAlign: 'middle',
                                fill: '#94a3b8',
                                fontSize: 12 * scale,
                            },
                        },
                        {
                            type: 'text',
                            top: 0,
                            style: {
                                text: String(total),
                                textAlign: 'center',
                                textVerticalAlign: 'middle',
                                fill: '#e2e8f0',
                                fontSize: 22 * scale,
                                fontWeight: 'bold',
                            },
                        },
                    ],
                },
            ],
            legend: {
                type: 'scroll',
                orient: 'vertical',
                right: 0,
                top: 'center',
                itemWidth: 10 * scale,
                itemHeight: 10 * scale,
                itemGap: 12 * scale,
                textStyle: { color: '#94a3b8', fontSize: 14 * scale },
                pageIconColor: '#1993ff',
                pageIconInactiveColor: '#94a3b8',
                pageIconSize: 12 * scale,
                pageTextStyle: { color: '#94a3b8', fontSize: 12 * scale },
            },
            series: [
                {
                    type: 'pie',
                    radius: ['45%', '65%'],
                    center: ['35%', '50%'],
                    showEmptyCircle: false,
                    avoidLabelOverlap: false,
                    label: { show: false },
                    emphasis: { scale: false },
                    itemStyle: {
                        borderColor: 'transparent',
                        borderWidth: 0,
                        borderRadius: 6 * scale,
                    },
                    data: finalSeriesData,
                },
            ],
        };
    }

    /** 事件等级分布 */
    private getLevelDistributionOptions(): unknown {
        const data = (this.dataList()[1]?.apiStatus?.res as Array<{
            level: string;
            count: number;
        }>) || [];
        const scale = this.dashboardService.scalingFactor;
        const palette = [
            '#FF5C5C',
            '#FFB020',
            '#1993ff',
            '#00E676',
            '#8C6BFF',
            '#00C4D4',
            '#FF8A3D',
            '#5CB85C',
            '#E05CC8',
            '#FFD54F',
        ];
        const levelColorMap: Record<string, string> = {
            '01': '#ba1621',
            '02': '#e57409',
            '03': '#f7d216',
            '04': '#1993ff',
        };
        let paletteFallbackIndex = 0;
        const lang = this.translateService.currentLang || '';
        const seriesData = data.map((item) => {
            const mappedColor = levelColorMap[item.level];
            const color = mappedColor ?? palette[paletteFallbackIndex++ % palette.length];
            return {
                name: getI18nName_1(leaveMap, item.level, lang),
                level: item.level,
                value: item.count ?? 0,
                itemStyle: { color },
            };
        });
        const total = data.reduce((sum, item) => sum + (item.count ?? 0), 0);
        const finalSeriesData = seriesData.length
            ? seriesData
            : [
                  {
                      value: 1,
                      name: '',
                      itemStyle: { color: 'rgba(148, 163, 184, 0.2)' },
                      emphasis: { disabled: true },
                      label: { show: false },
                      labelLine: { show: false },
                      tooltip: { show: false },
                  },
              ];
        return {
            tooltip: {
                trigger: 'item',
                appendTo: this.dashboardService.dashboardBody,
                backgroundColor: 'rgba(15, 23, 42, 0.92)',
                borderColor: 'rgba(148, 163, 184, 0.2)',
                borderWidth: 1 * scale,
                padding: [8 * scale, 12 * scale],
                textStyle: { color: '#e2e8f0', fontSize: 14 * scale },
                formatter: '{b}: {c} ({d}%)',
            },
            backgroundColor: 'transparent',
            graphic: [
                {
                    type: 'group',
                    left: '35%',
                    top: '50%',
                    bounding: 'raw',
                    children: [
                        {
                            type: 'text',
                            top: -16,
                            style: {
                                text: this.translateService.instant('dashboard_total'),
                                textAlign: 'center',
                                textVerticalAlign: 'middle',
                                fill: '#94a3b8',
                                fontSize: 12 * scale,
                            },
                        },
                        {
                            type: 'text',
                            top: 0,
                            style: {
                                text: String(total),
                                textAlign: 'center',
                                textVerticalAlign: 'middle',
                                fill: '#e2e8f0',
                                fontSize: 22 * scale,
                                fontWeight: 'bold',
                            },
                        },
                    ],
                },
            ],
            legend: {
                type: 'scroll',
                orient: 'vertical',
                right: 0,
                top: 'center',
                itemWidth: 10 * scale,
                itemHeight: 10 * scale,
                itemGap: 12 * scale,
                textStyle: { color: '#94a3b8', fontSize: 14 * scale },
                pageIconColor: '#1993ff',
                pageIconInactiveColor: '#94a3b8',
                pageIconSize: 12 * scale,
                pageTextStyle: { color: '#94a3b8', fontSize: 12 * scale },
            },
            series: [
                {
                    type: 'pie',
                    radius: ['45%', '65%'],
                    center: ['35%', 'middle'],
                    showEmptyCircle: false,
                    avoidLabelOverlap: false,
                    label: { show: false },
                    emphasis: { scale: false },
                    itemStyle: {
                        borderColor: 'transparent',
                        borderWidth: 0,
                        borderRadius: 6 * scale,
                    },
                    data: finalSeriesData,
                },
            ],
        };
    }

    /** 事件分类统计 */
    private getTypeStatisticsOptions(): unknown {
        const data = (this.dataList()[2]?.apiStatus?.res as Array<{
            eventName: string;
            count: number;
        }>) || [];
        const scale = this.dashboardService.scalingFactor;
        const xAxisData = data.map((item) => item.eventName);
        const barGradientStops = [
            { offset: 0, color: '#3B69FF' },
            { offset: 1, color: '#4B97FA' },
        ];
        const barGradient = new graphic.LinearGradient(0, 0, 0, 1, barGradientStops);
        const barData = data.map((item) => ({
            value: item.count ?? 0,
            eventName: item.eventName,
            itemStyle: {
                color: barGradient,
                borderRadius: [6 * scale, 6 * scale, 0, 0],
            },
        }));
        return {
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
                    interval: 0,
                    hideOverlap: false,
                    color: '#94a3b8',
                    fontSize: 14 * scale,
                    formatter: (val: string): string =>
                        val.length > 8 ? val.substring(0, 8) + '...' : val,
                },
            },
            yAxis: {
                type: 'value',
                scale: true,
                min: 0,
                axisLabel: { color: '#94a3b8', fontSize: 14 * scale },
                axisLine: { show: false },
                axisTick: { show: false },
                splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)' } },
            },
            series: [
                {
                    name: this.translateService.instant('dashboard_count'),
                    type: 'bar',
                    barMaxWidth: 24 * scale,
                    barGap: '30%',
                    minBarHeight: 2 * scale,
                    itemStyle: { color: '#1993ff' },
                    data: barData,
                },
            ],
        };
    }
}
