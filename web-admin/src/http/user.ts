import qs from 'qs';

import { useApiService } from './request.ts';
import { getNanoid } from '~/common/guid.ts';

const allApi = {
    /** 登录，目前由系统写死 */
    login(params?: any) {
        return Promise.resolve({
            msg: '操作成功',
            code: 200,
            data: 'token值',
        });
    },
    /** 用户信息，目前由系统写死 */
    info() {
        const info = {
            name: 'admin',
            nickname: '23朵毒蘑菇',
            avatar: '/icons/imgs/logo.png',
            synopsis: '这个人很懒，什么都没有留下',
            initDate: '2026-01-01 08:00:00',
        };
        return Promise.resolve({
            msg: '操作成功',
            code: 200,
            data: info,
        });
    },
    /**
     * 系统权限列表，目前由系统写死（扁平结构，nodeName/parentNodeName关联层级，uId为uuid唯一标识）
     * routePath只负责跳转，routeParams为路由参数，routePathRule负责路由权限校验
     * type区分菜单权限和按钮权限
     */
    permissionList() {
        const permissionList: any[] = [
            {
                uId: getNanoid(),
                nodeName: 'setup',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                routePath: '/main/setup',
                routePathRule: '/main/setup',
                title: '网站设置',
                hasTag: true,
                isCache: false,
                fixed: false,
                menuIconName: 'svg:laptop.svg',
            },
            {
                uId: getNanoid(),
                nodeName: 'post',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                title: '文章管理',
                menuIconName: 'svg:newspaper.svg',
                content: '列表，详情，添加',
            },
            {
                uId: getNanoid(),
                nodeName: 'post-list',
                parentNodeName: 'post',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                routePath: '/main/post/list',
                routePathRule: '/main/post/list',
                title: '文章列表',
                hasTag: true,
                menuIconName: 'svg:align-left.svg',
                showTagIcon: true,
                isCache: true,
            },
            {
                uId: getNanoid(),
                nodeName: 'post-info',
                parentNodeName: 'post',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                routePathRule: '/main/post/info/:sign',
                title: '文章详情',
                hasTag: true,
                menuIconName: 'svg:laptop-minimal-check.svg',
                showTagIcon: true,
                hidden: true,
            },
            {
                uId: getNanoid(),
                nodeName: 'post-add',
                parentNodeName: 'post',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                routePath: '/main/post/add',
                routePathRule: '/main/post/add',
                title: '文章添加',
                hasTag: true,
                menuIconName: 'svg:plus.svg',
                showTagIcon: true,
                isCache: true,
            },
            {
                uId: getNanoid(),
                nodeName: 'post-update',
                parentNodeName: 'post',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                routePathRule: '/main/post/update/:sign',
                title: '文章修改',
                hasTag: true,
                showTagIcon: true,
                hidden: true,
                isCache: true,
            },
            {
                uId: getNanoid(),
                nodeName: 'post-list-add',
                parentNodeName: 'post-list',
                type: 'bt',
                btCode: 'post-list:add',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                title: '新增文章',
            },
            {
                uId: getNanoid(),
                nodeName: 'post-list-delete',
                parentNodeName: 'post-list',
                type: 'bt',
                btCode: 'post-list:delete',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                title: '删除文章',
            },
            {
                uId: getNanoid(),
                nodeName: 'post-list-export',
                parentNodeName: 'post-list',
                type: 'bt',
                btCode: 'post-list:export',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                title: '导出文章',
            },
            {
                uId: getNanoid(),
                nodeName: 'friendly-link-list',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                routePath: '/main/friendly-link/list',
                routePathRule: '/main/friendly-link/list',
                title: '友情链接列表',
                hasTag: true,
                menuIconName: 'svg:send.svg',
                showTagIcon: true,
                isCache: true,
            },
            {
                uId: getNanoid(),
                nodeName: 'link',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                title: '博客链接',
                menuIconName: 'svg:align-center.svg',
                content: '实时检查线上站点',
            },
            {
                uId: getNanoid(),
                nodeName: 'link-home',
                parentNodeName: 'link',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                routePath: '/main/iframe/blog',
                routeParams: location.origin,
                hasTag: true,
                routePathRule: '/main/iframe/:sign',
                title: '博客首页',
                content: '站内链接',
                menuIconName: 'img:logo.png',
                showTagIcon: true,
                isCache: true,
            },
            {
                uId: getNanoid(),
                nodeName: 'link-out',
                parentNodeName: 'link',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                title: '博客首页',
                menuIconName: 'svg:external-link.svg',
                content: '外部链接',
                isLink: true,
                routePath: location.origin,
            },
            {
                uId: getNanoid(),
                nodeName: 'icon-list',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                routePath: '/main/icon-list',
                routePathRule: '/main/icon-list',
                title: 'icon 列表展示',
                hasTag: true,
                isCache: true,
                content: '系统自带的icon图标',
                menuIconName: 'img:logo.png',
                showTagIcon: true,
                number: '',
            },
            {
                uId: getNanoid(),
                nodeName: 'tag-manage',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                routePath: '/main/tag-manage',
                routePathRule: '/main/tag-manage',
                title: '标签管理示例',
                hasTag: true,
                menuIconName: 'svg:pin.svg',
                showTagIcon: true,
                isCache: false,
                content: 'tag-manage.ts 的使用示例',
            },
            {
                uId: getNanoid(),
                nodeName: 'permission-list',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                routePath: '/main/permission-list',
                routePathRule: '/main/permission-list',
                title: '权限列表管理',
                hasTag: true,
                menuIconName: 'svg:key-round.svg',
                showTagIcon: true,
                isCache: false,
                content: '管理员管理权限配置',
            },
            {
                uId: getNanoid(),
                nodeName: 'permission-list-add',
                parentNodeName: 'permission-list',
                type: 'bt',
                btCode: 'permission-list:add',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                title: '新增权限',
            },
            {
                uId: getNanoid(),
                nodeName: 'permission-list-update',
                parentNodeName: 'permission-list',
                type: 'bt',
                btCode: 'permission-list:update',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                title: '修改权限',
            },
            {
                uId: getNanoid(),
                nodeName: 'permission-list-delete',
                parentNodeName: 'permission-list',
                type: 'bt',
                btCode: 'permission-list:delete',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                title: '删除权限',
            },
        ];
        return Promise.resolve({
            msg: '操作成功',
            code: 200,
            data: permissionList,
        });
    },
    /** 退出登录，目前由系统写死 */
    logout(params?: any) {
        return Promise.resolve({
            msg: '操作成功',
            code: 200,
            data: true,
        });
    },
    update(params?: any) {
        return useApiService()({
            url: '/user/update',
            method: 'put',
            data: qs.parse(params),
        });
    },
    updateAboutHtml(params?: any) {
        return useApiService()({
            url: '/user/update-about-html',
            method: 'put',
            data: qs.parse(params),
        });
    },
    updatePassword(params?: any) {
        return useApiService()({
            url: '/user/update-password',
            method: 'put',
            data: qs.parse(params),
        });
    },
    updateSignPassword(params?: any) {
        return useApiService()({
            url: '/user/update-sign-password',
            method: 'put',
            data: qs.parse(params),
        });
    },
};

export default allApi;
