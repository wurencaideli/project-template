import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    OnDestroy,
    ViewChild,
    computed,
    inject,
    signal,
} from '@angular/core';
import { DumoguScrollbar } from 'dumogu-scrollbar';
import { TranslateService } from '@ngx-translate/core';
import { SvgIconComponent } from '../../components/svg-icon/component';
import { LandscapeComponent } from './landscape/component';
import { Content1CpComponent } from './content-1/component';
import { Content2CpComponent } from './content-2/component';
import { Content3CpComponent } from './content-3/component';
import { Content4CpComponent } from './content-4/component';
import { TopCpComponent } from './top/component';
import { debounce, deepClone, isEnglish } from '../../utils/common.utils';
import { setupElFullScreen } from '../../utils/action.utils';
import { useScalingModeStorage } from '../../action/storage-manage';
import { getDay, timestampToStr, weekList_zh, weekList_en } from '../../utils/date.util';
import { DashboardService, type CommonData } from './service';
import { ApiService } from '../../service/api.service';
type ScalingMode = 'contain' | 'cover' | 'fixed';
/** 从本地存储恢复缩放模式,非法值回退 contain */
function initialScalingMode(): ScalingMode {
    const saved = useScalingModeStorage().value;
    return saved === 'cover' || saved === 'fixed' ? saved : 'contain';
}
/**
 * 仪表盘主组件:
 * - 自适应容器尺寸(contain / cover / fixed 三种模式:等比适配 / 铺满裁剪 / 按设计图固定宽高)
 * - 全屏切换 / 自动刷新开关 / 时钟
 * - 通过 DashboardService 共享配置,任何缩放/刷新都通过 commonDataChanged 通知子组件
 */
@Component({
    selector: 'dashboard-one-view',
    standalone: true,
    imports: [
        SvgIconComponent,
        LandscapeComponent,
        Content1CpComponent,
        Content2CpComponent,
        Content3CpComponent,
        Content4CpComponent,
        TopCpComponent,
    ],
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardOneComponent implements OnDestroy {
    private readonly dashboardService = inject(DashboardService);
    private readonly translateService = inject(TranslateService);
    private readonly apiService = inject(ApiService);
    @ViewChild('dashboardBody') dashboardBody?: ElementRef<HTMLElement>;
    @ViewChild('dashboardBodyContainer') dashboardBodyContainer?: ElementRef<HTMLElement>;
    @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLElement>;
    private customScrollbar: DumoguScrollbar | null = null;
    private fullScreenHandle: { switch: () => void; destroy: () => void } | null = null;
    private ro: ResizeObserver | null = null;
    private dayTimer: ReturnType<typeof setInterval> | null = null;
    private sizeChangeTimer: ReturnType<typeof setInterval> | null = null;
    private autoRefreshTimer: ReturnType<typeof setTimeout> | null = null;
    readonly isFullscreen = signal(false);
    readonly day = signal('');
    readonly time = signal('');
    readonly date = signal('');
    readonly title = signal('');
    readonly openAutoRefresh = signal(true);
    readonly autoRefreshTooltip = signal('');
    readonly serviceCommonData = signal<CommonData>(this.dashboardService.commonData);
    readonly scalingMode = signal<ScalingMode>(initialScalingMode());
    readonly scalingModes = computed(() => [
        {
            value: 'contain' as ScalingMode,
            label: this.translateService.instant('dashboard_scaling_mode_contain'),
        },
        {
            value: 'cover' as ScalingMode,
            label: this.translateService.instant('dashboard_scaling_mode_cover'),
        },
        {
            value: 'fixed' as ScalingMode,
            label: this.translateService.instant('dashboard_scaling_mode_fixed'),
        },
    ]);
    readonly autoRefreshTitle = computed(() =>
        this.translateService.instant(
            this.openAutoRefresh() ? 'dashboard_auto_refresh_on' : 'dashboard_auto_refresh_off',
        ),
    );
    ngAfterViewInit(): void {
        // 让出本轮变更检测:setupContainerSize 会同步写入 dashboardService 引用,
        // 避免子模板中条件渲染触发 NG0100。
        setTimeout(() => {
            this.serviceCommonData.set(deepClone(this.dashboardService.commonData));
            this.dashboardService.commonDataChanged.subscribe(() => {
                this.serviceCommonData.set(deepClone(this.dashboardService.commonData));
            });
            this.setupContainerSize();
            this.setupCustomScrollbar();
            this.addResizeObserver();
            this.addFullscreenChangeListener();
            this.refreshDay();
            this.dayTimer = setInterval(() => this.refreshDay(), 16);
            this.sizeChangeTimer = setInterval(() => this.setupContainerSize(), 3000);
            this.refreshTitle();
            this.setAutoRefresh(this.openAutoRefresh());
            this.getData();
        }, 16);
    }
    ngOnDestroy(): void {
        if (this.ro) this.ro.disconnect();
        this.fullScreenHandle?.destroy();
        if (this.dayTimer) clearInterval(this.dayTimer);
        if (this.sizeChangeTimer) clearInterval(this.sizeChangeTimer);
        if (this.autoRefreshTimer) clearTimeout(this.autoRefreshTimer);
        this.customScrollbar?.destroy();
        this.customScrollbar = null;
    }
    private addResizeObserver(): void {
        const el = this.dashboardBody?.nativeElement;
        if (!el) return;
        this.ro = new ResizeObserver(debounce(() => this.setupContainerSize(), 300));
        this.ro.observe(el);
    }
    private addFullscreenChangeListener(): void {
        const el = document.documentElement;
        if (!el) return;
        this.fullScreenHandle = setupElFullScreen(el, (isFs: boolean) =>
            this.isFullscreen.set(isFs),
        );
    }
    /** 手动刷新:子组件监听 refreshNumber 变化后重新拉取各自数据 */
    manualRefresh(): void {
        this.dashboardService.commonData.refreshNumber++;
        this.dashboardService.commonDataChanged.emit();
    }
    selectFullscreen(): void {
        this.fullScreenHandle?.switch();
    }
    setScalingMode(mode: ScalingMode): void {
        if (this.scalingMode() === mode) return;
        this.scalingMode.set(mode);
        useScalingModeStorage().value = mode;
        this.setupContainerSize();
    }
    private setupContainerSize(): void {
        const body = this.dashboardBody?.nativeElement;
        const container = this.dashboardBodyContainer?.nativeElement;
        if (!body || !container) return;
        this.dashboardService.dashboardBody = body;
        this.dashboardService.dashboardBodyContainer = container;
        if (this.scalingMode() === 'cover') {
            this.dashboardService.setupContainerSizeCover({
                dashboardBody: body,
                dashboardBodyContainer: container,
            });
        } else if (this.scalingMode() === 'fixed') {
            this.dashboardService.setupContainerSizeFixed({
                dashboardBody: body,
                dashboardBodyContainer: container,
            });
        } else {
            this.dashboardService.setupContainerSize({
                dashboardBody: body,
                dashboardBodyContainer: container,
            });
        }
        this.customScrollbar?.update();
    }
    private setupCustomScrollbar(): void {
        if (this.customScrollbar) return;
        const hostEl = this.dashboardBody?.nativeElement;
        const scrollEl = this.scrollContainer?.nativeElement;
        if (!hostEl || !scrollEl) return;
        this.customScrollbar = new DumoguScrollbar({ keepShow: false });
        this.customScrollbar.bind(scrollEl);
        this.customScrollbar.mount(hostEl);
    }
    private refreshDay(): void {
        const isEn = isEnglish(this.translateService.getCurrentLang());
        const nowDate: number = new Date().getTime();
        const dayIndex = Number(getDay(nowDate));
        this.day.set(isEn ? (weekList_en[dayIndex] ?? '') : (weekList_zh[dayIndex] ?? ''));
        this.time.set(timestampToStr(nowDate, 'HH:mm:ss'));
        this.date.set(timestampToStr(nowDate, 'YYYY-MM-DD'));
    }
    private setupAutoRefresh(): void {
        if (this.autoRefreshTimer) clearTimeout(this.autoRefreshTimer);
        if (!this.openAutoRefresh()) return;
        this.autoRefreshTimer = setTimeout(() => {
            this.manualRefresh();
            this.setupAutoRefresh();
        }, 1000 * 60);
    }
    setAutoRefresh(checked: boolean): void {
        this.openAutoRefresh.set(!!checked);
        this.autoRefreshTooltip.set(
            this.translateService.instant(
                this.openAutoRefresh() ? 'dashboard_auto_refresh_on' : 'dashboard_auto_refresh_off',
            ),
        );
        this.setupAutoRefresh();
    }
    private refreshTitle(): void {
        const template = this.dashboardService.commonData.disTemplate;
        const isEn = isEnglish(this.translateService.getCurrentLang());
        this.title.set(
            isEn ? (template.titleEn ?? '') : (template.titleZh ?? template.titleCh ?? ''),
        );
    }
    /** 拉取大屏初始化数据(目前是模板配置:标题/地图类型/查询配置,后续可扩展其他数据)写入公共数据;子组件监听 commonDataChanged 后重新初始化 */
    private getData(): void {
        this.apiService
            .queryDashboardConfig({})
            .then((res: any) => {
                const template = res?.data || {};
                const old = this.dashboardService.commonData.disTemplate;
                this.dashboardService.commonData.disTemplate = {
                    titleZh: template.titleZh,
                    titleCh: template.titleCh,
                    titleEn: template.titleEn,
                    mapType: template.mapType || old?.mapType,
                };
                this.refreshTitle();
                this.dashboardService.commonData.refreshNumber++;
                this.dashboardService.commonDataChanged.emit();
            })
            .catch(() => {
                // 拉取失败保留 service 默认配置,大屏仍可正常展示
            });
    }
}
