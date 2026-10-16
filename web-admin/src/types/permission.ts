/**
 * 权限项类型（权限列表，扁平结构，nodeName/parentNodeName关联层级）
 */
export interface PermissionItem {
    uId: string; //唯一标识，uuid
    nodeName: string; //节点名称，用于确定层级关系
    parentNodeName?: string; //父级节点名称
    sort?: number; //排序
    type: 'menu' | 'bt'; //权限类型，区分菜单权限和按钮权限
    btCode?: string; //按钮权限编码
    layoutGroupSign: string; //分组标识
    redirectName: string; //重定向的目标
    routePath?: string; //路由地址，只负责跳转
    routeParams?: string; //路由参数，跳转时替换path末段
    routePathRule?: string; //路由匹配规则，负责路由权限校验
    title: string; //菜单显示字样
    menuIconName?: string; //菜单icon图标
    content?: string; //菜单显示的详情
    number?: string; //菜单显示的数字
    hidden?: boolean; //是否在左边目录上显示
    isLink?: boolean; //直接跳转新页面
    isCache?: boolean; //该标签页面是否缓存
    fixed?: boolean; //标签是否固定
    showTagIcon?: boolean; //标签显示的时候是否显示图标
    tagIconName?: string; //标签图标
    hasTag?: boolean; //可以生成标签
}
