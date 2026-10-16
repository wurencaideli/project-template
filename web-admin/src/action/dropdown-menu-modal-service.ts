import { createVNode, render, type App, type AppContext, type Component, type VNode } from 'vue';
import { DumoguDropdownMenu, type AreaOption, type DumoguDropdownMenuOptions } from 'dumogu-dropdown-menu';
import 'dumogu-dropdown-menu/dist/dumogu-dropdown-menu.css';

export interface DropdownMenuOptions extends DumoguDropdownMenuOptions {
    target?: HTMLElement;
    component?: Component;
    props?: Record<string, any>;
}
export interface DropdownMenuInstance {
    id: number;
    menu: DumoguDropdownMenu;
    target?: HTMLElement;
    componentInstance: any;
    isMounted: boolean;
    isDestroyed: boolean;
    show: boolean;
    readonly dropdownMenuContainerEl: HTMLElement;
    mount: () => void;
    unmount: () => void;
    destroy: () => void;
    setProps: (props: Record<string, any>) => void;
}

function getArea(rect: DOMRect): AreaOption {
    const start: [number, number] = [rect.x, rect.y];
    const end: [number, number] = [rect.x + rect.width, rect.y + rect.height];
    return { start, end, width: rect.width, height: rect.height };
}

let menuId = 0;
let appContext: AppContext | null = null;
const menuInstances: DropdownMenuInstance[] = [];
let rafId: number | null = null;

export function setupDropdownMenuModalService(app: App) {
    appContext = app._context;
}

function startTick() {
    if (rafId != null) return;
    const tick = () => {
        for (const item of menuInstances) {
            if (item.isDestroyed) continue;
            if (item.target) {
                item.menu.area = getArea(item.target.getBoundingClientRect());
            }
            item.menu.apply();
        }
        rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
}
function stopTick() {
    if (rafId == null || menuInstances.length > 0) return;
    cancelAnimationFrame(rafId);
    rafId = null;
}

export function createDropdownMenu(options: DropdownMenuOptions): DropdownMenuInstance {
    const id = menuId++;
    const { target, component, props, ...menuOptions } = options;
    let host: HTMLElement | null = null;
    let componentInstance: any = null;
    let vNode: VNode | null = null;
    if (component) {
        host = document.createElement('div');
        host.classList.add('dropdown-menu-modal');
        vNode = createVNode(component, props ?? null);
        vNode.appContext = appContext;
        render(vNode, host);
        componentInstance = vNode.component?.proxy;
        menuOptions.content = host;
    }
    const menu = new DumoguDropdownMenu(menuOptions);
    const instance: DropdownMenuInstance = {
        id,
        menu,
        target,
        componentInstance,
        isMounted: menu.isMounted,
        isDestroyed: false,
        get show() {
            return menu.show;
        },
        set show(value: boolean) {
            menu.show = value;
        },
        get dropdownMenuContainerEl() {
            return menu.dropdownMenuContainerEl;
        },
        mount: () => {
            if (instance.isDestroyed) return;
            menu.mount();
            instance.isMounted = true;
        },
        unmount: () => {
            menu.unmount();
            instance.isMounted = false;
        },
        destroy: () => {
            if (instance.isDestroyed) return;
            instance.isDestroyed = true;
            menu.destroy();
            if (host) {
                render(null, host);
            }
            const idx = menuInstances.findIndex((item) => item.id === id);
            if (idx >= 0) {
                menuInstances.splice(idx, 1);
            }
            stopTick();
        },
        setProps: (newProps: Record<string, any>) => {
            if (!vNode?.component) return;
            Object.assign(vNode.component.props, newProps);
        },
    };
    menuInstances.push(instance);
    startTick();
    return instance;
}

export function mountAllDropdownMenus(): void {
    menuInstances.forEach((item) => item.mount());
}
export function unmountAllDropdownMenus(): void {
    menuInstances.forEach((item) => item.unmount());
}
export function destroyAllDropdownMenus(): void {
    [...menuInstances].forEach((item) => item.destroy());
}
