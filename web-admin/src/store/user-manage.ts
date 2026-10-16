import { match } from 'path-to-regexp';

import { userDataStore } from '~/store/user.ts';
import { filterTags } from '~/store/tag-manage.ts';
import userApi from '~/http/user.ts';
import { toTree } from '~/common/tree-tools.ts';
import { getNanoid } from '~/common/guid.ts';
import type { PermissionItem } from '~/types/permission.ts';

export function getUserData() {
    return Promise.resolve().then(async () => {
        const userData = userDataStore();
        /** 获取用户信息 */
        const userInfo = await userApi.info().then((res) => {
            return res.data || {};
        });
        userData.setUserInfo(userInfo);
        /**
         * 获取用户权限列表
         * routePath只负责跳转，routeParams为路由参数，routePathRule负责路由权限校验
         * type区分菜单权限和按钮权限
         */
        const permissionList: PermissionItem[] = await userApi.permissionList().then((res) => {
            return res.data || [];
        });
        /** 系统自带的权限 */
        const systemPermissionList: PermissionItem[] = [
            {
                uId: getNanoid(),
                nodeName: 'main-redirect',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                routePathRule: '/main/redirect/:sign',
                title: '重定向',
                hidden: true,
            },
            {
                uId: getNanoid(),
                nodeName: 'main-index',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                routePath: '/main/index',
                routePathRule: '/main/index',
                title: '首页',
                hasTag: true,
                isCache: true,
                fixed: true,
                hidden: false,
                menuIconName: 'svg:layout-dashboard.svg',
                sort: -1,
            },
            {
                uId: getNanoid(),
                nodeName: 'main-401',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                routePath: '/main/401',
                routePathRule: '/main/401',
                title: '401',
                hidden: true,
            },
            {
                uId: getNanoid(),
                nodeName: 'main-404',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                routePath: '/main/404',
                routePathRule: '/main/404',
                title: '404',
                hidden: true,
            },
            {
                uId: getNanoid(),
                nodeName: 'iframe',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                routePathRule: '/main/iframe/:sign',
                title: '站内链接',
                hasTag: true,
                isCache: true,
                fixed: false,
                hidden: true,
            },
            {
                uId: getNanoid(),
                nodeName: 'main-mine-info',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                routePath: '/main/mine/info',
                routePathRule: '/main/mine/info',
                title: '个人信息',
                hasTag: true,
                isCache: false,
                fixed: false,
                hidden: true,
            },
            {
                uId: getNanoid(),
                nodeName: 'main-mine-info-update',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                routePath: '/main/mine/info-update',
                routePathRule: '/main/mine/info-update',
                title: '修改个人信息',
                hasTag: true,
                isCache: false,
                fixed: false,
                hidden: true,
            },
            {
                uId: getNanoid(),
                nodeName: 'main-mine-info-password',
                type: 'menu',
                layoutGroupSign: 'main',
                redirectName: 'main-redirect',
                routePath: '/main/mine/info-password',
                routePathRule: '/main/mine/info-password',
                title: '修改密码',
                hasTag: true,
                isCache: false,
                fixed: false,
                hidden: true,
            },
        ];
        permissionList.push(...systemPermissionList);
        permissionList.sort(
            (a: PermissionItem, b: PermissionItem) => (Number(a.sort) || 0) - (Number(b.sort) || 0),
        );
        setPermissionList(permissionList);
    });
}
const pathRegexpMatchMap: Record<string, ReturnType<typeof match>> = {};
/** 按路由匹配规则查找配置，规则为path-to-regexp语法 */
export function findPermissionConfigByRoutePath(path: string) {
    const userData = userDataStore();
    return userData.permissionList.find((item: PermissionItem) => {
        if (!item.routePathRule) return false;
        pathRegexpMatchMap[item.routePathRule] =
            pathRegexpMatchMap[item.routePathRule] || match(item.routePathRule);
        return !!pathRegexpMatchMap[item.routePathRule](path);
    });
}
/**
 * 写入权限列表，并生成菜单树
 */
export function setPermissionList(value: PermissionItem[]) {
    const userData = userDataStore();
    const permissionList = value || [];
    /** 展示菜单从权限列表中提取，菜单类型且不隐藏的 */
    const userMenuList = permissionList.filter(
        (item: PermissionItem) => item.type == 'menu' && !item.hidden,
    );
    /** 扁平结构转树形，用于菜单展示 */
    const menuTree = toTree(userMenuList, {
        key: 'nodeName',
        pKey: 'parentNodeName',
        childrenKey: 'children',
        isNew: true,
    });
    /** 按钮权限转map，以btCode为键 */
    const permissionBtCodeMap: Record<string, PermissionItem> = {};
    permissionList.forEach((item: PermissionItem) => {
        if (item.type == 'bt' && item.btCode) {
            permissionBtCodeMap[item.btCode] = item;
        }
    });
    userData.setPermissionData({
        permissionList,
        menuTree,
        permissionBtCodeMap,
    });
    /** 权限加载后重建持久化标签与权限的关系 */
    filterTags();
}
