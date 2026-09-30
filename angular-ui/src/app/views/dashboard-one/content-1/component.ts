import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import { DashboardService } from '../service';
import { ApiService } from '../../../service/api.service';
import { debounce, delay, deepClone } from '../../../utils/common.utils';
import { SvgIconComponent } from '../../../components/svg-icon/component';
import { DefineChartComponent } from '../../../components/define-chart/component';
import { HeadCpComponent } from '../head/component';
// 本页面用到的图表类型按需注册
use([LineChart, GridComponent]);
interface FormState {
    startMoment: Date | null;
    endMoment: Date | null;
    startPlaceholder: string;
    endPlaceholder: string;
}
/** 按天统计接口返回约定:day 为 'YYYY-MM-DD',系列 N 的数量字段为 countN */
interface ApiStatus {
    loading: boolean;
    res: Array<{ day: string; count1?: number }>;
    error: string;
}
/**
 * 折线图区块(模板规范):日期范围筛选 + 单系列按天走势,标题用「标题N」占位。
 * - apiStatus 是普通属性,每次请求换新对象,回调只改局部对象(竞态保护)
 * - 页面展示状态(loading/error)与 options 走 signal,订阅用 takeUntilDestroyed
 */
@Component({
    selector: 'content-1-cp',
    standalone: true,
    imports: [CommonModule, SvgIconComponent, DefineChartComponent, HeadCpComponent],
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Content1CpComponent {
    private readonly translateService = inject(TranslateService);
    private readonly dashboardService = inject(DashboardService);
    private readonly apiService = inject(ApiService);
    private readonly destroyRef = inject(DestroyRef);
    /** 初始为空对象:首次 initData 时新旧计数必然不等,保证首屏拉数 */
    serviceCommonData: any = {};
    readonly options = signal<unknown>({});
    readonly form = signal<FormState>({
        startMoment: null,
        endMoment: null,
        startPlaceholder: this.translateService.instant('content1_start_placeholder'),
        endPlaceholder: this.translateService.instant('content1_end_placeholder'),
    });
    apiStatus: ApiStatus = { loading: false, res: [], error: '' };
    /** 页面展示的加载状态:apiStatus 更新后从中取值刷入 */
    readonly loadState = signal({ loading: false, error: '' });
    /** 标题(模板规范):与 top 组件一致,「标题N」占位 */
    readonly title = signal('标题1');
    readonly retryLabel = signal(this.translateService.instant('content4_retry'));
    readonly refreshLabel = signal(this.translateService.instant('content1_refresh'));
    constructor() {
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
    private async initData(): Promise<void> {
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
    private getSevenDaysAgo(): Date {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        date.setHours(0, 0, 0, 0);
        return date;
    }
    /** 把 <input type="date"> 的字符串值解析为本地午夜 Date */
    parseDateInput(value: string | Date): Date {
        if (value instanceof Date) return value;
        if (!value) return new Date(NaN);
        const parts = String(value).split('-').map((v) => parseInt(v, 10));
        if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return new Date(NaN);
        return new Date(parts[0]!, parts[1]! - 1, parts[2]!);
    }
    /** 起始日期变更 */
    onStartChange(value: { date: Date }): void {
        this.form.update((f) => ({ ...f, startMoment: value.date }));
        this.retryFetch();
    }
    /** 结束日期变更 */
    onEndChange(value: { date: Date }): void {
        this.form.update((f) => ({ ...f, endMoment: value.date }));
        this.retryFetch();
    }
    /** 获取异步数据 */
    private async getData(): Promise<void> {
        // 未选日期时默认最近 7 天;参数与 top 组件一致(filter + startTime/endTime)
        if (!this.form().startMoment || !this.form().endMoment) {
            this.form.update((f) => ({
                ...f,
                startMoment: this.getSevenDaysAgo(),
                endMoment: new Date(),
            }));
        }
        const f = this.form();
        const apiStatus: ApiStatus = { loading: true, res: [], error: '' };
        this.apiStatus = apiStatus;
        this.loadState.set({ loading: this.apiStatus.loading, error: this.apiStatus.error });
        await this.apiService
            .dailyCountStatistics({
                filter: [{ column: 'app', value: 'EventGPT', relation: '=' }],
                startTime: f.startMoment!.getTime(),
                endTime: f.endMoment!.getTime(),
            })
            .then((res: { data?: ApiStatus['res'] }) => {
                apiStatus.res = res.data || [];
                if (apiStatus.res.length == 0) {
                    apiStatus.error = this.translateService.instant('dashboard_data_empty');
                }
            })
            .catch(() => {
                apiStatus.error = this.translateService.instant('dashboard_api_error');
            });
        apiStatus.loading = false;
        this.loadState.set({ loading: this.apiStatus.loading, error: this.apiStatus.error });
    }
    /** 刷新连点/emit 突发时合并为一次「拉取+重绘」(150ms);日期变更也走这里 */
    retryFetch = debounce(async () => {
        await this.getData();
        this.initChartOptions();
    }, 150);
    /** 根据数据渲染图表:单系列,数值取接口返回的 count1 */
    initChartOptions(): void {
        const seriesList = this.apiStatus.res || [];
        const scale = this.dashboardService.scalingFactor;
        this.options.set({
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
            grid: {
                left: 36 * scale,
                right: 12 * scale,
                top: 15 * scale,
                bottom: 24 * scale,
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: seriesList.map((item) => item.day),
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
            series: [
                {
                    name: '数量1',
                    type: 'line',
                    smooth: true,
                    symbol: 'circle',
                    symbolSize: 8 * scale,
                    lineStyle: { color: '#00E676', width: 3 * scale },
                    itemStyle: {
                        color: '#00E676',
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
                                { offset: 0, color: 'rgba(0, 230, 118, 0.45)' },
                                { offset: 1, color: 'rgba(0, 0, 0, 0)' },
                            ],
                        },
                    },
                    data: seriesList.map((item) => item.count1 ?? 0),
                },
            ],
        });
    }
}
