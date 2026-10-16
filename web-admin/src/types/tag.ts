import type { PermissionItem } from '~/types/permission.ts';

/**
 * 标签数据类型
 * 由权限配置（目录）创建而来，附加路由定位与顺序字段
 */
export interface Tag extends PermissionItem {
    routePath: string; //路由地址
    routeFullPath: string; //完整地址
    routeName?: string; //路由名，取自系统路由的name
    tagShowNumber?: number; //显示次数，回退标签时使用
    isActive?: boolean; //是否是当前激活的标签，路由切换时设置
}
