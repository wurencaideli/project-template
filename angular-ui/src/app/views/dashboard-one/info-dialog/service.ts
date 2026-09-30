import { DestroyRef, Injectable, inject } from '@angular/core';
import { Router, NavigationStart } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { DefineModalInstance, DefineModalService } from '../../../service/define-modal.service';
import { InfoDialogComponent } from './component';
/** 事件选择对话框对外句柄 */
export interface InfoDialogHandle {
    id: number;
    modalInstance: DefineModalInstance;
    isDestroy: boolean;
    isShow: boolean;
    show: (show: boolean) => void;
    destroy: () => void;
}
/**
 * InfoDialog 路由级 service。
 * - 路由开始跳转时自动销毁所有对话框,避免页面切换后弹窗残留。
 * - 提供 create() / destroyAll() 两个公开方法。
 */
@Injectable()
export class InfoDialogService {
    private readonly modalService = inject(DefineModalService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);
    private dialogList: InfoDialogHandle[] = [];
    constructor() {
        this.router.events
            .pipe(
                filter((event): event is NavigationStart => event instanceof NavigationStart),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(() => this.destroyAll());
    }
    create(config: Record<string, any> = {}): InfoDialogHandle {
        const modalInstance = this.modalService.create(InfoDialogComponent, {
            windowClass: 'info-dialog-class',
            container: config.container,
        });
        const onCancel = config?.onCancel;
        const onConfirm = config?.onConfirm;
        const handle: InfoDialogHandle = {
            id: modalInstance.id,
            modalInstance,
            isDestroy: false,
            isShow: true,
            show: (show: boolean) => {
                handle.isShow = show;
                if (show) modalInstance.mount();
                modalInstance.componentInstance.setShow(show);
            },
            destroy: () => {
                handle.isDestroy = true;
                modalInstance.componentInstance.setShow(false);
            },
        };
        handle.show(true);
        modalInstance.componentInstance.initData(config).catch((e: unknown) => {
            console.error('component initData failed:', e);
        });
        modalInstance.componentInstance.onDismiss.subscribe((res: unknown) => onCancel?.(res));
        modalInstance.componentInstance.onConfirm.subscribe((res: unknown) => onConfirm?.(res));
        modalInstance.componentInstance.animationEnd.subscribe(() => {
            if (!handle.isShow) modalInstance.unmount();
            if (handle.isDestroy) modalInstance.destroy();
        });
        this.dialogList.push(handle);
        return handle;
    }
    destroyAll(): void {
        this.dialogList.forEach((handle) => {
            try {
                handle?.destroy?.();
            } catch {
                /* ignore already destroyed */
            }
        });
        this.dialogList = [];
    }
}