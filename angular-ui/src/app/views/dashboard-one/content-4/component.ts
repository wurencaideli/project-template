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
import {
    GraphicComponent,
    GridComponent,
    LegendComponent,
    TooltipComponent,
} from 'echarts/components';
import { DashboardService } from '../service';
import { ApiService } from '../../../service/api.service';
import { debounce, delay, deepClone } from '../../../utils/common.utils';
import { SvgIconComponent } from '../../../components/svg-icon/component';
import { DefineChartComponent } from '../../../components/define-chart/component';
import { HeadCpComponent } from '../head/component';
import { ChartHeadCpComponent } from '../chart-head/component';
use([BarChart, PieChart, GraphicComponent, GridComponent, LegendComponent, TooltipComponent]);
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
 * 底部三宫格(模板规范):饼图占位 + 等级饼图 + 分类柱状图,标题用「标题N」占位。
 * - apiStatus 内嵌在 dataList 各项里:请求开始放入新对象,回调原地修改,结束后 dataList.set(同一引用) 触发重渲染;过期请求只改孤儿对象,无写回即无竞态
 * - 页面展示状态与 options 走 signal,订阅用 takeUntilDestroyed
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
    serviceCommonData: any = {};
    readonly dataList = signal<DataItem[]>([]);
    /** 标题(模板规范):与 top 组件一致,「标题N」占位 */
    readonly title = signal('标题4');
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
        this.dataList.set(
            [1, 2, 3].map((id) => ({
                id,
                title: `标题${id}`,
                options: {},
                apiStatus: { ...INITIAL_SUB_STATUS },
            })),
        );
    }
    private async initData(): Promise<void> {
        const oldServiceCommonData = this.serviceCommonData;
        this.serviceCommonData = deepClone(this.dashboardService.commonData);
        const cur = this.serviceCommonData;
        if (cur.refreshNumber > (oldServiceCommonData.refreshNumber || 0)) {
            this.refreshAll();
        }
        if (cur.viewSizeChangeNumber > (oldServiceCommonData.viewSizeChangeNumber || 0)) {
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
        this.updateItem(2, (item) => ({ ...item, apiStatus }));
        await this.apiService
            .levelStatistics({
                filter: [{ column: 'app', value: 'EventGPT', relation: '=' }],
                startTime: this.getSevenDaysAgo().getTime(),
                endTime: Date.now(),
            })
            .then((res: { data?: unknown[] }) => {
                apiStatus.res = res.data || [];
            })
            .catch(() => {
                apiStatus.error = this.translateService.instant('dashboard_api_error');
            });
        apiStatus.loading = false;
        this.dataList.set(this.dataList());
    }
    private async getData_3(): Promise<void> {
        const apiStatus: SubApiStatus = { loading: true, res: [], error: '' };
        this.updateItem(3, (item) => ({ ...item, apiStatus }));
        await this.apiService
            .typeStatistics({
                filter: [{ column: 'app', value: 'EventGPT', relation: '=' }],
                startTime: this.getSevenDaysAgo().getTime(),
                endTime: Date.now(),
            })
            .then((res: { data?: unknown[] }) => {
                apiStatus.res = res.data || [];
            })
            .catch(() => {
                apiStatus.error = this.translateService.instant('dashboard_api_error');
            });
        apiStatus.loading = false;
        this.dataList.set(this.dataList());
    }
    private updateItem(id: number, fn: (item: DataItem) => DataItem): void {
        this.dataList.set(this.dataList().map((item) => (item.id === id ? fn(item) : item)));
    }
    /** 单项重试:防抖合并连点,150ms 只执行最后一次 */
    retryFetch = debounce(async (id: number) => {
        const fetcherMap: Record<number, () => Promise<void>> = {
            1: this.getData_1.bind(this),
            2: this.getData_2.bind(this),
            3: this.getData_3.bind(this),
        };
        const fetcher = fetcherMap[id];
        if (fetcher) {
            await fetcher();
            this.initChartOptions();
        }
    }, 150);
    /** 刷新连点/emit 突发时合并为一次「拉取+重绘」(150ms) */
    refreshAll = debounce(async () => {
        await this.getData();
        this.initChartOptions();
    }, 150);
    initChartOptions(): void {
        this.updateItem(1, (item) => ({ ...item, options: this.getStageDistributionOptions() }));
        this.updateItem(2, (item) => ({ ...item, options: this.getLevelDistributionOptions() }));
        this.updateItem(3, (item) => ({ ...item, options: this.getTypeStatisticsOptions() }));
    }
    /** 处理过程阶段分布(占位,接口暂未启用) */
    private getStageDistributionOptions(): unknown {
        const data =
            (this.dataList()[0]?.apiStatus?.res as Array<{
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
        const seriesData = data.map((item, index) => ({
            name: item.type,
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
                className: 'dashboard-chart-tooltip',
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
        const data =
            (this.dataList()[1]?.apiStatus?.res as Array<{
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
        const seriesData = data.map((item) => {
            const mappedColor = levelColorMap[item.level];
            const color = mappedColor ?? palette[paletteFallbackIndex++ % palette.length];
            return {
                name: item.level,
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
                className: 'dashboard-chart-tooltip',
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
    /** 分类柱状图(模板规范):类目取 name,数值取 count */
    private getTypeStatisticsOptions(): unknown {
        const data =
            (this.dataList()[2]?.apiStatus?.res as Array<{
                name: string;
                count: number;
            }>) || [];
        const scale = this.dashboardService.scalingFactor;
        const xAxisData = data.map((item) => item.name);
        const barGradientStops = [
            { offset: 0, color: '#00C853' },
            { offset: 1, color: '#69F0AE' },
        ];
        const barGradient = new graphic.LinearGradient(0, 0, 0, 1, barGradientStops);
        const barData = data.map((item) => ({
            value: item.count ?? 0,
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
                className: 'dashboard-chart-tooltip',
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
                    name: '数量1',
                    type: 'bar',
                    barMaxWidth: 24 * scale,
                    barGap: '30%',
                    minBarHeight: 2 * scale,
                    itemStyle: { color: '#00E676' },
                    data: barData,
                },
            ],
        };
    }
}
