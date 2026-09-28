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
import { getDay, timestampToStr, weekList_zh, weekList_en } from '../../utils/date.util';
import { DashboardService, type CommonData } from './service';

type ScalingMode = 'contain' | 'cover';

/**
 * 仪表盘主组件:
 * - 自适应容器尺寸(contain / cover 两种模式)
 * - 全屏切换 / 自动刷新开关 / 时钟
 * - 通过 DashboardService 共享配置,任何缩放/刷新都通过 commonDataChanged 通知子组件
 */
@Component({
    selector: 'event-dashboard-view',
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
export class EventDashboardComponent implements OnDestroy {
    private readonly dashboardService = inject(DashboardService);
    private readonly translateService = inject(TranslateService);

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

    readonly scalingMode = signal<ScalingMode>(
        (() => {
            try {
                return localStorage.getItem('event-dashboard-scaling-mode') === 'cover'
                    ? 'cover'
                    : 'contain';
            } catch {
                return 'contain';
            }
        })(),
    );

    readonly scalingModes = computed(() => [
        {
            value: 'contain' as ScalingMode,
            label: this.translateService.instant('dashboard_scaling_mode_contain'),
        },
        {
            value: 'cover' as ScalingMode,
            label: this.translateService.instant('dashboard_scaling_mode_cover'),
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
        this.ro = new ResizeObserver(
            debounce(() => this.setupContainerSize(), 300),
        );
        this.ro.observe(el);
    }

    private addFullscreenChangeListener(): void {
        const el = document.documentElement;
        if (!el) return;
        this.fullScreenHandle = setupElFullScreen(el, (isFs: boolean) => this.isFullscreen.set(isFs));
    }

    selectFullscreen(): void {
        this.fullScreenHandle?.switch();
    }

    setScalingMode(mode: ScalingMode): void {
        if (this.scalingMode() === mode) return;
        this.scalingMode.set(mode);
        try {
            localStorage.setItem('event-dashboard-scaling-mode', mode);
        } catch {
            // localStorage 可能被禁用,不影响当前会话
        }
        this.setupContainerSize();
    }

    private setupContainerSize(): void {
        const body = this.dashboardBody?.nativeElement;
        const container = this.dashboardBodyContainer?.nativeElement;
        if (!body || !container) return;
        this.dashboardService.dashboardBody = body;
        this.dashboardService.dashboardBodyContainer = container;
        if (this.scalingMode() === 'cover') {
            this.dashboardService.setupContainerSizeCover({ dashboardBody: body, dashboardBodyContainer: container });
        } else {
            this.dashboardService.setupContainerSize({ dashboardBody: body, dashboardBodyContainer: container });
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
        const isEn = isEnglish(this.translateService.currentLang);
        const nowDate: number = new Date().getTime();
        const dayIndex = Number(getDay(nowDate));
        this.day.set(isEn ? weekList_en[dayIndex] ?? '' : weekList_zh[dayIndex] ?? '');
        this.time.set(timestampToStr(nowDate, 'HH:mm:ss'));
        this.date.set(timestampToStr(nowDate, 'YYYY-MM-DD'));
    }

    private setupAutoRefresh(): void {
        if (this.autoRefreshTimer) clearTimeout(this.autoRefreshTimer);
        if (!this.openAutoRefresh()) return;
        this.autoRefreshTimer = setTimeout(() => this.setupAutoRefresh(), 1000 * 60);
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
        const isEn = isEnglish(this.translateService.currentLang);
        this.title.set(isEn ? template.titleEn ?? '' : template.titleZh ?? template.titleCh ?? '');
    }
}