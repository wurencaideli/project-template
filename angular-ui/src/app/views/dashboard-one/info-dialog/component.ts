import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    OnDestroy,
    ViewChild,
    signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SvgIconComponent } from '../../../components/svg-icon/component';
/** CSS 中动画时长约 200ms,留 150ms 余量作为 fallback 定时器,避免 transitionend 丢失导致 service 永远等不到 animationEnd */
const ANIM_END_FALLBACK_MS = 350;
/**
 * 极简信息弹窗组件:展示标题 + ng-content。
 * - 通过 setShow(true/false) 控制开关,关闭动画完成后 emit animationEnd;
 * - 内部 state 用 signal,OnPush + zoneless 安全。
 */
@Component({
    selector: 'info-dialog-cp',
    standalone: true,
    imports: [TranslateModule, SvgIconComponent],
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoDialogComponent implements OnDestroy {
    readonly onDismiss = new EventEmitter<unknown>();
    readonly onConfirm = new EventEmitter<unknown>();
    readonly animationEnd = new EventEmitter<void>();
    @ViewChild('mask', { static: false }) maskRef?: ElementRef<HTMLElement>;
    @ViewChild('bodyContainer', { static: false }) bodyRef?: ElementRef<HTMLElement>;
    readonly isOpen = signal(false);
    readonly title = signal<string>('');
    private closeToken = 0;
    private pendingClose?: {
        listener: EventListenerOrEventListenerObject;
        timer: ReturnType<typeof setTimeout>;
    };
    setShow(show: boolean): void {
        if (this.isOpen() === show) return;
        this.cancelPendingClose();
        this.isOpen.set(show);
        if (show) return;
        const body = this.bodyRef?.nativeElement;
        if (!body) {
            this.animationEnd.emit();
            return;
        }
        const token = ++this.closeToken;
        const listener: EventListenerOrEventListenerObject = {
            handleEvent: (ev: Event) => {
                const e = ev as TransitionEvent;
                if (e.target !== body) return;
                if (e.propertyName !== 'transform') return;
                if (token !== this.closeToken) return;
                this.cancelPendingClose();
                this.animationEnd.emit();
            },
        };
        body.addEventListener('animationend', listener);
        const timer = setTimeout(() => {
            if (token !== this.closeToken) return;
            this.cancelPendingClose();
            this.animationEnd.emit();
        }, ANIM_END_FALLBACK_MS);
        this.pendingClose = { listener, timer };
    }
    handleDismiss(): void {
        this.onDismiss.emit();
    }
    handleClick(option: unknown): void {
        this.onConfirm.emit(option);
    }
    async initData(options: { title?: string } = {}): Promise<void> {
        this.title.set(options.title ?? '');
    }
    ngOnDestroy(): void {
        this.cancelPendingClose();
        this.onDismiss.complete();
        this.onConfirm.complete();
        this.animationEnd.complete();
    }
    private cancelPendingClose(): void {
        if (!this.pendingClose) return;
        const { listener, timer } = this.pendingClose;
        clearTimeout(timer);
        const body = this.bodyRef?.nativeElement;
        if (body) body.removeEventListener('animationend', listener);
        this.pendingClose = undefined;
    }
}