import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    ViewChild,
    inject,
    signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { use, registerMap } from 'echarts/core';
import { MapChart } from 'echarts/charts';
import { GeoComponent, TooltipComponent } from 'echarts/components';
import { SVGRenderer } from 'echarts/renderers';
import { DashboardService } from '../service';
import { ApiService } from '../../../service/api.service';
import { debounce, delay, deepClone } from '../../../utils/common.utils';
import { SvgIconComponent } from '../../../components/svg-icon/component';
import { DefineChartComponent } from '../../../components/define-chart/component';
import { HeadCpComponent } from '../head/component';
use([MapChart, GeoComponent, TooltipComponent, SVGRenderer]);
interface ColorLegendItem {
    key: string;
    color: string;
    label: string;
}
interface ApiStatus {
    loading: boolean;
    res: Map<string, RegionData>;
    error: string;
}
interface RegionData {
    count: number;
    bgColor: string;
}
const colorMap: Readonly<Record<string, string>> = {
    none: 'transparent',
    low: '#7BC8FF',
    mid: '#1993ff',
    high: '#ec792b',
    severe: '#e24949',
};
// 图例配置：与 getColorByCount 的阈值一一对应，用于在页面上展示颜色与事件量的对应关系
// 区间：1-19 / 20-49 / 50-99，100+ 进入 severe
const colorLegendConfig: ReadonlyArray<{
    key: string;
    color: string;
    min: number;
    max: number | null;
}> = [
    { key: 'none', color: colorMap['none']!, min: 0, max: 0 },
    { key: 'low', color: colorMap['low']!, min: 1, max: 19 },
    { key: 'mid', color: colorMap['mid']!, min: 20, max: 49 },
    { key: 'high', color: colorMap['high']!, min: 50, max: 99 },
    { key: 'severe', color: colorMap['severe']!, min: 100, max: null },
];
/**
 * 地图区块(模板规范):拉取 GeoJSON + 区域统计,渲染到 ECharts 地图,标题用「标题N」占位。
 * - apiStatus 是普通属性,每次请求换新对象,回调只改局部对象(竞态保护)
 * - 页面展示状态(loading/error)走 signal,订阅用 takeUntilDestroyed
 */
@Component({
    selector: 'landscape-cp',
    standalone: true,
    imports: [TranslateModule, SvgIconComponent, DefineChartComponent, HeadCpComponent],
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandscapeComponent {
    private readonly translateService = inject(TranslateService);
    private readonly dashboardService = inject(DashboardService);
    private readonly apiService = inject(ApiService);
    private readonly destroyRef = inject(DestroyRef);
    serviceCommonData: any = {};
    apiStatus: ApiStatus = { loading: false, res: new Map(), error: '' };
    /** 页面展示的加载状态:apiStatus 更新后从中取值刷入 */
    readonly loadState = signal({ loading: false, error: '' });
    /** 标题(模板规范):与 top 组件一致,「标题N」占位 */
    readonly title = signal('标题5');
    readonly retryLabel = signal(this.translateService.instant('content4_retry'));
    readonly refreshLabel = signal(this.translateService.instant('landscape_refresh'));
    readonly fillMapLabel = signal(this.translateService.instant('landscape_fill_map'));
    readonly colorLegend = signal<ColorLegendItem[]>(
        colorLegendConfig.map((item) => ({
            key: item.key,
            color: item.color,
            label:
                item.max === null
                    ? `≥ ${item.min}`
                    : item.min === item.max
                      ? `${item.min}`
                      : `${item.min} - ${item.max}`,
        })),
    );
    private areaJsonMap = new Map<string, unknown>();
    @ViewChild('chartRef', { static: false }) chartRef?: DefineChartComponent;
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
            this.showAllData();
        }
    }
    /** 刷新连点/emit 突发时合并为一次「拉取+重绘」(150ms) */
    retryFetch = debounce(async () => {
        await this.getData();
        this.showAllData();
    }, 150);
    private getSevenDaysAgo(): Date {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        date.setHours(0, 0, 0, 0);
        return date;
    }
    /** 获取异步数据 */
    private async getData(): Promise<void> {
        const apiStatus: ApiStatus = {
            loading: true,
            res: new Map(),
            error: '',
        };
        this.apiStatus = apiStatus;
        this.loadState.set({ loading: this.apiStatus.loading, error: this.apiStatus.error });
        const mapType = (this.serviceCommonData.disTemplate.mapType || '').toLowerCase();
        if (!mapType) {
            apiStatus.loading = false;
            this.loadState.set({ loading: this.apiStatus.loading, error: this.apiStatus.error });
            return;
        }
        try {
            if (!this.areaJsonMap.get(mapType)) {
                const rawGeoJson = await this.apiService.getGeoData(mapType).catch(() => ({}));
                this.areaJsonMap.set(mapType, rawGeoJson);
            }
            apiStatus.res = await this.loadEventStatisticsByRegions();
        } catch {
            apiStatus.error = this.translateService.instant('dashboard_api_error');
        }
        apiStatus.loading = false;
        this.loadState.set({ loading: this.apiStatus.loading, error: this.apiStatus.error });
    }
    toggleFillMap(): void {
        this.dashboardService.commonData.fillMap = !this.dashboardService.commonData.fillMap;
        this.dashboardService.commonDataChanged.emit();
    }
    private extractNamesFromGeoJson(rawGeoJson: unknown): string[] {
        if (!rawGeoJson || !Array.isArray((rawGeoJson as { features?: unknown[] }).features)) {
            return [];
        }
        return (rawGeoJson as { features: Array<{ properties?: { name?: unknown } }> }).features
            .map((feature) => feature?.properties?.name as string | undefined)
            .filter((name): name is string => typeof name === 'string' && name.length > 0);
    }
    private getColorByCount(count: number): string {
        if (!count || count <= 0) return colorMap['none']!;
        if (count < 20) return colorMap['low']!;
        if (count < 50) return colorMap['mid']!;
        if (count < 100) return colorMap['high']!;
        return colorMap['severe']!;
    }
    /** 区域统计:一次请求返回全部区域数据,不逐区域请求 */
    private async loadEventStatisticsByRegions(): Promise<Map<string, RegionData>> {
        const mapType = (this.serviceCommonData.disTemplate.mapType || '').toLowerCase();
        const names = this.extractNamesFromGeoJson(this.areaJsonMap.get(mapType));
        const result = new Map<string, RegionData>();
        if (names.length === 0) {
            return result;
        }
        const res = await this.apiService.regionStatistics({
            filter: [
                {
                    column: 'region',
                    value: mapType,
                    relation: '=',
                },
            ],
            startTime: this.getSevenDaysAgo().getTime(),
            endTime: Date.now(),
            regions: names,
        });
        const list = res.data || [];
        list.forEach((item: { name: string; count: number }) => {
            const count = item.count || 0;
            result.set(item.name, { count, bgColor: this.getColorByCount(count) });
        });
        return result;
    }
    /** 根据 dataList 展示所有区域数据 */
    showAllData(): void {
        const el = this.chartRef?.componentRef?.nativeElement;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const mapType = (this.serviceCommonData.disTemplate.mapType || '').toLowerCase();
        if (!this.areaJsonMap.get(mapType)) return;
        const seriesData: Array<{ name: string; value: number; itemStyle: { areaColor: string } }> =
            [];
        this.apiStatus.res.forEach((item, name) => {
            seriesData.push(this.getBaseOption(name, item.count, item.bgColor));
        });
        void this.renderChartMap(mapType, seriesData);
    }
    private getBaseOption(
        item: string,
        value: number,
        color: string,
    ): {
        name: string;
        value: number;
        itemStyle: { areaColor: string };
        select: { disabled: boolean; itemStyle: { areaColor: string } };
    } {
        return {
            name: item,
            value: value,
            itemStyle: { areaColor: color },
            select: {
                disabled: false,
                itemStyle: {
                    areaColor: color,
                },
            },
        };
    }
    private async renderChartMap(
        mapType: string,
        data: Array<{ name: string; value: number; itemStyle: { areaColor: string } }>,
    ): Promise<void> {
        const scale = this.dashboardService.scalingFactor;
        registerMap('area', this.areaJsonMap.get(mapType) as Parameters<typeof registerMap>[1]);
        const tooltip = {
            show: true,
            trigger: 'item',
            renderMode: 'html',
            appendTo: this.dashboardService.dashboardBody,
            backgroundColor: '#00000000',
            borderWidth: 0,
            padding: 0,
            borderRadius: 0,
            extraCssText: '',
            transitionDuration: 0.2,
            formatter: (params: { name?: string }): string => {
                const item = this.apiStatus.res.get(params.name ?? '');
                if (!item) return '';
                return `
                    <div class="landscape-map-tooltip">
                        <div class="top">
                            <span>${params.name ?? ''}</span>
                            <span>${item.count || 0}</span>
                        </div>
                    </div>
                `;
            },
        };
        const options = {
            tooltip,
            series: [
                {
                    type: 'map',
                    map: 'area',
                    roam: false,
                    aspectScale: 1,
                    label: {
                        show: true,
                        color: '#ffffff',
                        fontSize: 20 * scale,
                        fontWeight: 600,
                        textBorderColor: 'rgba(15, 23, 42, 0.7)',
                        textBorderWidth: 1 * scale,
                        formatter: (params: { value?: number }): string => {
                            const value = params.value;
                            return typeof value === 'number' && !isNaN(value) ? `${value}` : ``;
                        },
                    },
                    selectedMode: false,
                    animation: false,
                    itemStyle: {
                        borderColor: 'rgb(226, 226, 226)',
                        borderWidth: 1 * scale,
                        areaColor: 'transparent',
                        opacity: 1,
                    },
                    emphasis: {
                        disabled: false,
                        itemStyle: {
                            borderColor: '#ffffff',
                            borderWidth: 1 * scale,
                            areaColor: 'inherit',
                        },
                        label: {
                            show: false,
                        },
                    },
                    select: {
                        disabled: true,
                        animation: false,
                        label: { show: false },
                        itemStyle: {
                            shadowColor: 'rgba(0, 0, 0, 0.25)',
                            shadowBlur: 6,
                            shadowOffsetX: 1,
                            shadowOffsetY: 1,
                            areaColor: 'inherit',
                            opacity: 1,
                        },
                    },
                    z: 9,
                    zlevel: 9,
                    data: data,
                },
            ],
        };
        try {
            this.chartRef?.setOption(options);
        } catch (e: unknown) {
            const prefix = this.translateService.instant('landscape_chart_failed');
            // eslint-disable-next-line no-console
            console.error(`${prefix}`, e);
        }
    }
}
