import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

import { userDataStore } from '~/store/user.ts';
import { getUserData, findPermissionConfigByRoutePath } from '~/store/user-manage.ts';
import { addTag, setActiveTag } from '~/store/tag-manage.ts';
import { messageError } from '~/action/message-prompt.ts';
import type { Tag } from '~/types/tag.ts';

export function initPermission(router: any) {
    NProgress.configure({
        easing: 'ease',
        speed: 300,
        showSpinner: false,
        trickleSpeed: 200,
        minimum: 0.3,
        parent: 'body',
    });
    /**
     * 免登录权限白名单，路由名
     */
    const whiteList = ['login', 'register', '404', '401'];
    router.beforeEach(async (to: any, from: any) => {
        NProgress.start();
        const userData = userDataStore();
        const toPath = to.path;
        const toName = to.name;
        const toFullPath = to.fullPath;
        /** 如果是白名单中的路由直接放行 */
        if (whiteList.includes(toName as string)) return;
        /**
         * 没登录的跳转到登录页面
         */
        const token = userData.token;
        if (!token) {
            return `/login?from=${encodeURIComponent(toFullPath)}`;
        }
        /** 如果没有用户信息则先获取用户数据 */
        if (!(userData.info as any).name) {
            await getUserData().catch((res) => {
                const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                messageError(msg);
            });
        }
        /**
         * 路由表中没有匹配的路由则转到 404 页面
         */
        if (!to.matched.length) {
            return `/404?fullPath=${toFullPath}`;
        }
        /**
         * 判断用户是否有该路由配置（判断是否有该路由权限）
         * 没权限的跳转到401页面
         */
        const userPermissionConfig = findPermissionConfigByRoutePath(toPath);
        if (!userPermissionConfig) {
            return `/401?fullPath=${toFullPath}`;
        }
        /** 添加标签 */
        const tag: Tag = Object.assign({}, userPermissionConfig, {
            routePath: toPath,
            routeFullPath: toFullPath,
        });
        addTag(tag);
    });
    router.afterEach((to: any) => {
        const toPath = to.path;
        /** 跳转完成后更新标签激活态 */
        const userPermissionConfig = findPermissionConfigByRoutePath(toPath);
        if (userPermissionConfig) {
            setActiveTag(toPath, userPermissionConfig.layoutGroupSign);
        }
        NProgress.done();
        /** 清除loading标记 */
        const loadingEl = document.querySelector('#html-loading-el');
        if (loadingEl) {
            loadingEl.remove();
        }
    });
}
