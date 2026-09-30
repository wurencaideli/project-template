import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    OnDestroy,
    ViewChild,
    effect,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { init, use } from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';
import ResizeObserver from 'resize-observer-polyfill';

import { debounce } from '../../utils/common.utils';

// 仅注册渲染器,具体图表类型由使用方按需注册,便于 tree-shaking
use([SVGRenderer]);

/**
 * 通用 ECharts 封装。SVG 渲染,支持外部 options 变更触发自动更新与 ResizeObserver 自适应。
 */
@Component({
    selector: 'define-chart-cp',
    standalone: true,
    template: `
        <div class="chart-host" #componentRef>
            @if (showLoading()) {
                <div class="chart-loading">
                    <div class="chart-loading__spinner"></div>
                </div>
            }
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
                position: relative;
                width: 100%;
                height: 100%;
            }
            .chart-host {
                width: 100%;
                height: 100%;
            }
            .chart-loading {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                background: radial-gradient(
                    circle,
                    rgba(0, 0, 0, 0.9) 0%,
                    rgba(0, 0, 0, 0.45) 55%,
                    rgba(0, 0, 0, 0) 100%
                );
                z-index: 2;
            }
            .chart-loading__spinner {
                width: 40px;
                height: 40px;
                border: 4px solid rgba(148, 163, 184, 0.25);
                border-top-color: #1993ff;
                border-radius: 50%;
                animation: chart-spin 1s linear infinite;
            }
            @keyframes chart-spin {
                to {
                    transform: rotate(360deg);
                }
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefineChartComponent implements OnDestroy {
    readonly options = input<unknown>({});
    readonly showLoading = input<boolean>(false);
    readonly isAuto = input<boolean>(false);
    readonly isAutoResize = input<boolean>(true);

    readonly onChartInit = output<any>();

    @ViewChild('componentRef', { static: false }) componentRef?: ElementRef<HTMLElement>;

    private chartInstance: any;
    private ro: ResizeObserver | null = null;
    private currentOptions = signal<unknown>({});

    constructor() {
        effect(() => {
            const opts = this.options();
            this.currentOptions.set(opts);
            // isAuto 时,init 之后的 options 变更自动应用到图表(首次应用仍在 ngAfterViewInit)
            if (this.isAuto() && this.chartInstance) {
                this.setOption(opts);
            }
        });
    }

    ngAfterViewInit(): void {
        this.initChart();
        if (this.isAuto()) {
            this.applyOptions(this.currentOptions());
        }
        this.watchResize();
    }

    ngOnDestroy(): void {
        this.ro?.disconnect();
        this.ro = null;
        this.chartInstance?.dispose();
        this.chartInstance = null;
    }

    /** 自动应用 options 变更 */
    applyCurrentOptions(): void {
        if (!this.isAuto()) return;
        this.setOption(this.currentOptions());
    }

    watchResize(): void {
        if (this.ro || !this.componentRef?.nativeElement) return;
        const ro = new ResizeObserver(
            debounce(() => {
                if (!this.isAutoResize()) return;
                this.handleResize();
            }, 150),
        );
        ro.observe(this.componentRef.nativeElement);
        this.ro = ro;
    }

    handleResize(): void {
        if (!this.componentRef?.nativeElement || !this.chartInstance) return;
        this.chartInstance.resize();
    }

    initChart(): any {
        if (this.chartInstance) return this.chartInstance;
        if (!this.componentRef?.nativeElement) return null;
        this.chartInstance = init(this.componentRef.nativeElement, undefined, { renderer: 'svg' });
        this.onChartInit.emit(this.chartInstance);
        return this.chartInstance;
    }

    /** 由外部调用设置 options */
    setOption(options: unknown): void {
        if (!this.chartInstance) this.initChart();
        this.handleResize();
        this.chartInstance?.setOption(options ?? {});
        setTimeout(() => this.handleResize(), 16);
    }

    private applyOptions(opts: unknown): void {
        this.setOption(opts);
    }
}