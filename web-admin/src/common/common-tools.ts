import copy from 'copy-to-clipboard';

/**是否是pc端 */
export function isPc() {
    const userAgent = navigator.userAgent;
    const Agents = ['Android', 'iPhone', 'SymbianOS', 'Windows Phone', 'iPad', 'iPod'];
    return !Agents.some((i) => {
        return userAgent.includes(i);
    });
}
/**
 * 深度复制一个对象
 */
export function deepCopyObj(obj: any) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * 数据粘贴板复制
 */
export function copyValue(value: string) {
    copy(value);
}
/** 是空的*/
export function isEmpty(value: any) {
    return !value && value !== 0;
}
/** 是否是生产环境 */
export function isProd() {
    return import.meta.env.PROD;
}
/** 获取构建的基础路径，不带尾斜杠 */
export function getBuildBase() {
    const base = import.meta.env.VITE_APP_buildBase;
    return base.endsWith('/') ? base.slice(0, -1) : base;
}
/** 去除首尾空格 */
export function toTrim(str: string) {
    str = (str || '').replace(/^\s+|\s+$/g, '');
    return str;
}
