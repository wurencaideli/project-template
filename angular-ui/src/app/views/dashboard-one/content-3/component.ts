import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { use, graphic } from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import { DashboardService } from '../service';
import { ApiService } from '../../../service/api.service';
import { debounce, delay, deepClone } from '../../../utils/common.utils';
import { SvgIconComponent } from '../../../components/svg-icon/component';
import { DefineChartComponent } from '../../../components/define-chart/component';
import { HeadCpComponent } from '../head/component';
use([BarChart, GridComponent]);
interface Filter {
    label: string;
    active: boolean;
    startMoment?: Date;
    endMoment?: Date;
}
/** 分类统计接口返回约定:类目字段为 name,数量字段为 count */
interface ApiStatus {
    loading: boolean;
    res: Array<{ name: string; count: number }>;
    error: string;
}
/**
 * 柱状图区块(模板规范):今日 / 本周 / 本月 三段切换,标题用「标题N」占位。
 * - apiStatus 是普通属性,每次请求换新对象,回调只改局部对象(竞态保护)
 * - 页面展示状态(loading/error)与 options 走 signal,订阅用 takeUntilDestroyed
 */
@Component({
    selector: 'content-3-cp',
    standalone: true,
    imports: [SvgIconComponent, DefineChartComponent, HeadCpComponent],
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Content3CpComponent {
    private readonly translateService = inject(TranslateService);
    private readonly dashboardService = inject(DashboardService);
    private readonly apiService = inject(ApiService);
    private readonly destroyRef = inject(DestroyRef);
    /** 初始为空对象:首次 initData 时新旧计数必然不等,保证首屏拉数 */
    serviceCommonData: any = {};
    readonly options = signal<unknown>({});
    readonly filters = signal<Filter[]>([]);
    apiStatus: ApiStatus = { loading: false, res: [], error: '' };
    /** 页面展示的加载状态:apiStatus 更新后从中取值刷入 */
    readonly loadState = signal({ loading: false, error: '' });
    /** 标题(模板规范):与 top 组件一致,「标题N」占位 */
    readonly title = signal('标题3');
    readonly retryLabel = signal(this.translateService.instant('content4_retry'));
    readonly refreshLabel = signal(this.translateService.instant('content3_refresh'));
    constructor() {
        this.initFilters();
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
    private initFilters(): void {
        this.filters.set([
            { label: this.translateService.instant('content3_filter_today'), active: true },
            { label: this.translateService.instant('content3_filter_week'), active: false },
            { label: this.translateService.instant('content3_filter_month'), active: false },
        ]);
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
    /** 获取异步数据 */
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
        this.apiStatus = apiStatus;
        this.loadState.set({ loading: this.apiStatus.loading, error: this.apiStatus.error });
        await this.apiService
            .categoryStatistics({
                filter: [{ column: 'app', value: 'EventGPT', relation: '=' }],
                startTime: active.startMoment.getTime(),
                endTime: active.endMoment.getTime(),
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
    /** 刷新连点/emit 突发时合并为一次「拉取+重绘」(150ms);筛选切换也走这里 */
    retryFetch = debounce(async () => {
        await this.getData();
        this.initChartOptions();
    }, 150);
    /** 切换今日 / 本周 / 本月筛选 */
    selectFilter(item: Filter): void {
        this.filters.set(this.filters().map((f) => ({ ...f, active: f.label === item.label })));
        this.retryFetch();
    }
    /** 根据数据渲染图表:单系列柱状,类目取 name,数值取 count */
    initChartOptions(): void {
        const scale = this.dashboardService.scalingFactor;
        const seriesList = this.apiStatus.res || [];
        const xAxisData = seriesList.map((item) => item.name);
        const barGradient = new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#3B69FF' },
            { offset: 1, color: '#4B97FA' },
        ]);
        const barData = seriesList.map((item) => ({
            value: item.count ?? 0,
            itemStyle: {
                color: barGradient,
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
                boundaryGap: true,
                data: xAxisData,
                axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.25)' } },
                axisTick: { show: false },
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
                    name: '数量1',
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
