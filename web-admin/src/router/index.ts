import { createWebHistory, createRouter, type RouteRecordRaw } from 'vue-router';

const constantRoutes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'login',
        component: () => import('~/views/login/index.vue'),
    },
    {
        path: '/404',
        component: () => import('~/views/system/error/404.vue'),
        name: '404',
    },
    {
        path: '/401',
        component: () => import('~/views/system/error/401.vue'),
        name: '401',
    },
    {
        path: '',
        redirect: '/main/index',
    },
    {
        path: '/main',
        component: () => import('~/layout/main/index.vue'),
        children: [
            {
                path: 'redirect/:sign',
                name: 'main-redirect',
                component: () => import('~/views/system/redirect/index.vue'),
            },
            {
                path: '401',
                name: 'main-401',
                component: () => import('~/views/system/error/401.vue'),
            },
            {
                path: '404',
                name: 'main-404',
                component: () => import('~/views/system/error/404.vue'),
            },
            {
                path: 'iframe/:sign',
                component: () => import('~/views/system/iframe/index.vue'),
                name: 'iframe',
            },
            {
                path: 'index',
                component: () => import('~/views/system/main/index.vue'),
                name: 'main-index',
            },
            {
                path: 'icon-list',
                component: () => import('~/views/system/icon-list/index.vue'),
                name: 'icon-list',
            },
            {
                path: 'tag-manage',
                component: () => import('~/views/system/tag-manage/index.vue'),
                name: 'tag-manage',
            },
            {
                path: 'permission-list',
                component: () => import('~/views/system/permission-list/index.vue'),
                name: 'permission-list',
            },
            {
                path: 'mine/info',
                component: () => import('~/views/system/mine/index.vue'),
                name: 'main-mine-info',
            },
            {
                path: 'mine/info-update',
                component: () => import('~/views/system/mine/update.vue'),
                name: 'main-mine-info-update',
            },
            {
                path: 'mine/info-password',
                component: () => import('~/views/system/mine/password.vue'),
                name: 'main-mine-info-password',
            },
            {
                path: 'post/list',
                component: () => import('~/views/post/index.vue'),
                name: 'post-list',
            },
            {
                path: 'post/info/:sign',
                component: () => import('~/views/post/add.vue'),
                name: 'post-info',
            },
            {
                path: 'post/add',
                component: () => import('~/views/post/add.vue'),
                name: 'post-add',
            },
            {
                path: 'post/update/:sign',
                component: () => import('~/views/post/add.vue'),
                name: 'post-update',
            },
            {
                path: 'friendly-link/list',
                component: () => import('~/views/friendly-link/index.vue'),
                name: 'friendly-link-list',
            },
            {
                path: 'setup',
                component: () => import('~/views/setup/index.vue'),
                name: 'setup',
            },
        ],
    },
];
let router: any;
export function useRouter() {
    if (router) return router;
    router = createRouter({
        history: createWebHistory(import.meta.env.VITE_APP_routeBasePath),
        routes: constantRoutes,
    });
    return router;
}
