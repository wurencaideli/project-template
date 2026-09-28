import { service } from './request.js';
import qs from 'qs';

const allApi = {
    login(params) {
        return service({
            url: '/user/login',
            method: 'post',
            data: qs.parse(params),
        });
    },
    info() {
        return service({
            url: '/user/info',
            method: 'get',
        });
    },
    /** 系统目录，目前由系统写死 */
    menuList() {
        let menuList = [
            {
                name: 'main-index',
                title: '首页',
                content: '数据概括',
                isCache: true,
                fixed: true,
                iconName: 'svg:all-fill.svg',
            },
            {
                title: '网站设置',
                name: 'setup',
                isCache: false,
                fixed: false,
                iconName: 'svg:laptop.svg',
            },
            {
                title: '文章管理',
                iconName: 'svg:database-plus.svg',
                content: '列表，详情，添加',
                childs: [
                    {
                        name: 'post-list',
                        title: '文章列表',
                        iconName: 'svg:alignleft-fill.svg',
                        showTagIcon: true,
                        isCache: true,
                    },
                    {
                        name: 'post-info',
                        title: '文章详情',
                        iconName: 'svg:laptop-check.svg',
                        showTagIcon: true,
                        hidden: true,
                    },
                    {
                        name: 'post-add',
                        title: '文章添加',
                        iconName: 'svg:plus.svg',
                        showTagIcon: true,
                        isCache: true,
                    },
                    {
                        name: 'post-update',
                        title: '文章修改',
                        showTagIcon: true,
                        hidden: true,
                        isCache: true,
                    },
                ],
            },
            {
                name: 'friendly-link-list',
                title: '友情链接列表',
                iconName: 'svg:paper-plane.svg',
                showTagIcon: true,
                isCache: true,
            },
            {
                name: 'file-list',
                title: '文件列表',
                iconName: 'svg:database.svg',
                showTagIcon: true,
                isCache: true,
            },
            {
                title: '博客链接',
                iconName: 'svg:aligncenter-fill.svg',
                content: '实时检查线上站点',
                childs: [
                    {
                        path: '/main/iframe/' + location.origin,
                        title: '博客首页',
                        content: '站内链接',
                        iconName: 'img:logo.png',
                        showTagIcon: true,
                        isCache: true,
                    },
                    {
                        title: '博客首页',
                        iconName: 'svg:friendship.svg',
                        content: '外部链接',
                        isLink: true,
                        path: location.origin,
                    },
                ],
            },
            {
                name: 'icon-list',
                title: 'icon 列表展示',
                isCache: true,
                content: '系统自带的icon图标',
                iconName: 'img:logo.png',
                showTagIcon: true,
                number: '',
            },
        ];
        return Promise.resolve({
            msg: '操作成功',
            code: 200,
            data: menuList,
        });
    },
    logout(params) {
        return service({
            url: '/user/logout',
            method: 'post',
            data: qs.parse(params),
        });
    },
    update(params) {
        return service({
            url: '/user/update',
            method: 'put',
            data: qs.parse(params),
        });
    },
    updateAboutHtml(params) {
        return service({
            url: '/user/update-about-html',
            method: 'put',
            data: qs.parse(params),
        });
    },
    updatePassword(params) {
        return service({
            url: '/user/update-password',
            method: 'put',
            data: qs.parse(params),
        });
    },
    updateSignPassword(params) {
        return service({
            url: '/user/update-sign-password',
            method: 'put',
            data: qs.parse(params),
        });
    },
};

export default allApi;
