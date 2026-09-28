import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    OnDestroy,
    SecurityContext,
    ViewChild,
    effect,
    inject,
    input,
    signal,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { marked } from 'marked';
import { SmartTextEllipsis } from 'smart-text-ellipsis';

/**
 * 长文本省略展示。支持 Markdown 渲染。
 * - 输入 description / isMd 是 signal,变化时自动重新计算文本并刷新省略;
 * - smart-text-ellipsis 监听 DOM 变化维持省略效果。
 */
@Component({
    selector: 'text-ellipsis-cp',
    standalone: true,
    template: `<div class="text-ellipsis-cp" #contentRef [innerHTML]="rendered()"></div>`,
    styles: [
        `
            :host {
                display: block;
            }
            .text-ellipsis-cp {
                word-break: break-word;
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextEllipsisComponent implements OnDestroy {
    @ViewChild('contentRef', { static: true }) contentRef?: ElementRef<HTMLElement>;

    readonly description = input<string | number>('');
    readonly isMd = input<boolean>(false);

    private readonly sanitizer = inject(DomSanitizer);

    readonly rendered = signal<string>('');

    private ste: SmartTextEllipsis | null = null;
    private updateTimer: ReturnType<typeof setInterval> | null = null;

    constructor() {
        effect(() => {
            const desc = this.description();
            const useMd = this.isMd();
            if (useMd) {
                const html = this.sanitizer.sanitize(
                    SecurityContext.HTML,
                    marked.parse(String(desc ?? '')),
                );
                this.rendered.set(html ?? '');
            } else {
                this.rendered.set(String(desc ?? ''));
            }
            queueMicrotask(() => this.ste?.update());
        });
    }

    ngAfterViewInit(): void {
        const el = this.contentRef?.nativeElement;
        if (!el) return;
        this.ste = new SmartTextEllipsis({ targetEl: el, isOpen: false, maxLines: 2 });
        this.updateTimer = setInterval(() => this.ste?.update(), 1500);
    }

    ngOnDestroy(): void {
        if (this.updateTimer) clearInterval(this.updateTimer);
        this.ste?.destroy();
        this.ste = null;
    }

    expand(): void {
        this.ste?.expand();
    }
    collapse(): void {
        this.ste?.collapse();
    }
}