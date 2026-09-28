import { Routes } from '@angular/router';

import { DashboardService } from './views/event-dashboard/service';
import { InfoDialogService } from './views/event-dashboard/info-dialog/service';

/**
 * 应用路由。全部使用 loadComponent + 路由级 providers,
 * 移除 NgModule 和 routing module,符合 Angular v22 standalone-first 范式。
 *
 * ApiService 是 providedIn:'root',不必重复声明;
 * DashboardService / InfoDialogService 仅在该路由可见。
 */
export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'icons',
    },
    {
        path: 'icons',
        loadComponent: () =>
            import('./views/icon-showcase/component').then((m) => m.IconShowcaseComponent),
    },
    {
        path: 'event-dashboard',
        loadComponent: () =>
            import('./views/event-dashboard/component').then((m) => m.EventDashboardComponent),
        providers: [DashboardService, InfoDialogService],
    },
    {
        path: '**',
        loadComponent: () => import('./views/empty/component').then((m) => m.EmptyComponent),
    },
];