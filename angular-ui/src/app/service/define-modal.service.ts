import {
    ApplicationRef,
    ComponentRef,
    EnvironmentInjector,
    Injectable,
    Type,
    createComponent,
} from '@angular/core';

export interface DefineModalConfig {
    windowClass?: string;
    container?: HTMLElement;
}
export interface DefineModalInstance {
    id: number;
    element: HTMLElement;
    componentInstance: any;
    isMounted: boolean;
    mountCount: number;
    isDestroyed: boolean;
    mount: () => void;
    unmount: () => void;
    destroy: () => void;
}

const BASE_Z_INDEX = 1000;
let modalId = 0;
let mountSeq = BASE_Z_INDEX;

/**
 * 极简弹窗服务:create(Component, config) 在 body 下插入一个带 windowClass 的包裹元素,
 * 并把传入的组件动态渲染进去。不含动画、键盘事件(esc/enter)、路由联动等逻辑。
 *
 * providedIn: 'root' 全局单例,任何注入该服务的组件都无需在模块 providers 中显式注册。
 *
 * 职责:仅"收集"实例——创建、挂载、跟踪、销毁;实例的复用/开关由外部调用方自行管理。
 * 能力:
 * - destroy(id):按 id 销毁指定实例;实例自身也带 destroy()。
 * - mount() / unmount():卸载不销毁,可重复挂载。
 */
@Injectable({ providedIn: 'root' })
export class DefineModalService {
    private readonly instances: DefineModalInstance[] = [];
    constructor(
        private appRef: ApplicationRef,
        private injector: EnvironmentInjector,
    ) {}
    /**
     * 创建弹窗:动态渲染 component 并返回实例(同时完成首次挂载)。每次调用都创建新实例;复用/开关由外部调用方自行管理。
     * @param component 要渲染的组件类(第一个参数)
     * @param config 配置:windowClass 加到外层包裹元素上;container 指定挂载容器(不传则挂 body)
     */
    create(component: Type<any>, config: DefineModalConfig = {}): DefineModalInstance {
        const id = modalId++;
        const host = document.createElement('div');
        host.classList.add('define-modal-el');
        if (config.windowClass) {
            host.classList.add(config.windowClass);
        }
        const mountTarget: HTMLElement = config.container ?? document.body;
        if (config.container) {
            host.style.position = 'absolute';
            host.style.top = '0';
            host.style.left = '0';
            host.style.width = '100%';
            host.style.height = '100%';
        }
        const componentRef: ComponentRef<any> = createComponent(component, {
            environmentInjector: this.injector,
        });
        this.appRef.attachView(componentRef.hostView);
        host.appendChild(componentRef.location.nativeElement);
        componentRef.changeDetectorRef.detectChanges();
        const instance: DefineModalInstance = {
            id,
            element: host,
            componentInstance: componentRef.instance,
            isMounted: false,
            mountCount: 0,
            isDestroyed: false,
            mount: () => {
                if (instance.isDestroyed) return;
                host.style.zIndex = String(++mountSeq);
                if (!instance.isMounted) {
                    mountTarget.appendChild(host);
                    instance.isMounted = true;
                    instance.mountCount++;
                }
            },
            unmount: () => {
                if (!instance.isMounted) return;
                host.parentNode?.removeChild(host);
                instance.isMounted = false;
            },
            destroy: () => {
                if (instance.isDestroyed) return;
                instance.isDestroyed = true;
                instance.unmount();
                if (!componentRef.hostView.destroyed) {
                    this.appRef.detachView(componentRef.hostView);
                    componentRef.destroy();
                }
                const idx = this.instances.findIndex((item) => item.id === id);
                if (idx >= 0) {
                    this.instances.splice(idx, 1);
                }
            },
        };
        this.instances.push(instance);
        instance.mount();
        return instance;
    }
    destroy(id: number): void {
        this.instances.find((item) => item.id === id)?.destroy();
    }
    destroyAll(): void {
        [...this.instances].forEach((item) => item.destroy());
    }
}
