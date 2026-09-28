import queryString from 'query-string';
import { v4 as idv4 } from 'uuid';
import centroid from '@turf/centroid';
import MD5 from 'crypto-js/md5';

export function getTextMd5(text: string) {
    if (!text) return '';
    // 计算并返回16进制MD5字符串
    return MD5(text).toString();
}
/** json转换为对象 */
export function JSONParse(e: unknown, string: string) {
    try {
        return JSON.parse(string);
    } catch {
        return e;
    }
}
/** 防抖方法 */
export function debounce(func: Function, wait: number) {
    let timeout: any = null;
    return function (this: any, ...args: any[]) {
        const context = this;
        // 清除之前的定时器
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        // 设置新的定时器
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}
/** 将百分比转出具体的数字 */
export function convertPercentageToNumber(percentageString: string | number) {
    if (typeof percentageString !== 'string') {
        percentageString = String(percentageString);
    }
    // 移除百分号并转换为数字
    const number = parseFloat(percentageString.replace('%', ''));
    // 计算实际值
    return number / 100;
}
export function isArray(ar: unknown) {
    return Array.isArray(ar);
}
export function isUndefined(arg: unknown) {
    return arg === void 0;
}
export function isNullOrUndefined(arg: unknown) {
    return arg == null;
}
/** 判断当前语言是否为英文 */
export function isEnglish(lang: string) {
    return /^en/i.test(lang || '');
}
/** 判断当前语言是否为中文 */
export function isChinese(lang: string) {
    return /^zh/i.test(lang || '');
}
/** 根据key获取链接上的参数 */
export function getQueryParam(url: string, key: string) {
    const urlObj = new URL(url);
    const searchParams = new URLSearchParams(urlObj.search);
    return searchParams.get(key);
}
export function getQueryParams(search: string, option?: queryString.ParseOptions) {
    return queryString.parse(search, option);
}
/** 判断元素是否全屏 */
export function isFullscreen(el?: any) {
    const fullscreenElement =
        document.fullscreenElement ||
        // @ts-ignore
        document.webkitFullscreenElement || // Chrome, Safari
        // @ts-ignore
        document.mozFullScreenElement || // Firefox
        // @ts-ignore
        document.msFullscreenElement; // IE/Edge
    if (!el) return !!fullscreenElement;
    return fullscreenElement === el;
}
/** 元素全屏 */
export async function elementFullscreen(element: HTMLElement) {
    if (!element.requestFullscreen) return;
    return element.requestFullscreen();
}
/** 退出全屏 */
export function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
        // @ts-ignore
    } else if (document.webkitExitFullscreen) {
        // @ts-ignore
        document.webkitExitFullscreen();
        // @ts-ignore
    } else if (document.mozCancelFullScreen) {
        // @ts-ignore
        document.mozCancelFullScreen();
        // @ts-ignore
    } else if (document.msExitFullscreen) {
        // @ts-ignore
        document.msExitFullscreen();
    }
}
/** 加载样式 */
export function loadStyles(url: string) {
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        link.href = url;
        link.onload = () => resolve(url);
        link.onerror = (err) => reject(err);
        document.body.appendChild(link);
    });
}
/** 创建uuid */
export function createUuid() {
    return idv4();
}
/** 设置font-size */
export function setRem(fontSize: string) {
    if (!fontSize) return;
    if (document.documentElement.style.fontSize == fontSize) return;
    document.documentElement.style.fontSize = fontSize;
}
/** 简单的深度克隆 */
export function deepClone<T = unknown>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}
/** 延迟执行 */
export function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * 根据省份中文名返回中心经纬度
 * @param name 省份中文名
 * @param geoJson 已注册的地图 GeoJSON
 * @returns [lng, lat]
 */
export function getCenterLngLat(name: string, geoJson: any): [number, number] {
    const feature = geoJson.features.find((f: any) => f.properties?.name === name);
    if (!feature) return [104.195397, 35.86166];
    // 计算质心
    const { geometry } = centroid(feature);
    return geometry.coordinates as [number, number];
}
/** 随机获取数组中的一个元素 */
export function randomItem<T = unknown>(arr: T[]): T | undefined {
    if (!Array.isArray(arr) || arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
}
/**
 * 截断字符串，超出指定长度时在末尾加 "..."
 */
export function truncate(str: string | number, max: number): string {
    if (!str && str !== 0) return '';
    str = String(str);
    if (max <= 0) return '';
    // 一个汉字 = 1 长度；如需「视觉宽度」可换成 Array.from(str).length
    if (str.length <= max) return str;
    return str.slice(0, max - 1) + '…'; // max-1 给 "…" 留位
}
/** 将数字转换为千分位 */
export function toThousands(n: number): string | number {
    if (!n) return n;
    const [int, dec] = String(n).split('.');
    const r = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return dec ? `${r}.${dec}` : r;
}
/**
 * 数字转万为单位，保留两位小数
 */
export function formatNumberToWan(num: number | string, de = 0) {
    const number = Number(num);
    if (isNaN(number)) {
        return (0).toFixed(de);
    }
    const wanNum = number / 10000;
    if (number === 0) {
        return wanNum.toFixed(de);
    }
    return wanNum.toFixed(de);
}
/**
 * 判断输入是否为超过千万（10000000）的数字
 */
export function isOverTenMillion(num: number | string) {
    const validNumber = Number(num);
    if (isNaN(validNumber) || !isFinite(validNumber)) {
        return false;
    }
    return validNumber > 10000000;
}

/**
 * 判断输入是否为超过千万（10000000）的数字
 */
export function isOverTenThousand(num: number | string) {
    const validNumber = Number(num);
    if (isNaN(validNumber) || !isFinite(validNumber)) {
        return false;
    }
    return validNumber > 10000;
}

export function formatNumberToThousand(num: number | string, de = 1) {
    const number = Number(num);
    if (isNaN(number)) {
        return (0).toFixed(de);
    }
    return (number / 1000).toFixed(de);
}

export function formatNumberToMillion(num: number | string, de = 1) {
    const number = Number(num);
    if (isNaN(number)) {
        return (0).toFixed(de);
    }
    return (number / 1000000).toFixed(de);
}

export function isOverMillion(num: number | string) {
    const validNumber = Number(num);
    if (isNaN(validNumber) || !isFinite(validNumber)) {
        return false;
    }
    return validNumber > 1000000;
}
/**
 * 竞态安全管道：按顺序执行数组中的步骤，每步之间检查是否过期。
 * - key: 唯一标识，不同 key 互不影响
 * - steps 数组中的每项：
 *   - Promise → await
 *   - 函数 → 执行，传入 (上一步的结果, 共享上下文ctx)
 *   - 函数如果返回 Promise → 也会 await
 *
 * ctx 上下文对象提供：
 *   - ctx.mine      当前调用的版本号（创建时快照）
 *   - ctx.isLatest() 检查当前调用是否仍然是最新的（未过期），可在 step 内部异步操作后随时调用
 *
 * 用法：
 * await competitionFn('user-query', [
 *     this.service.fetchData(),              // Promise → 等待
 *     async (res, ctx) => {                  // 函数 → 用上一个结果
 *         ctx.id = res?.id;
 *         const detail = await this.service.getDetail(ctx.id);
 *         if (!ctx.isLatest()) return;       // 内部异步后检查是否已过期
 *         ctx.name = detail.name;
 *     },
 * ]);
 */
const _competitionVersions: Record<string, number> = {};
export async function competitionFn(key: string, steps: any[]) {
    if (!_competitionVersions[key]) _competitionVersions[key] = 0;
    const mine = ++_competitionVersions[key];
    let prevResult: any;
    const ctx: any = {
        /** 当前调用的版本号，创建时快照 */
        mine,
        /** 检查当前调用是否仍然是最新的（未过期），可在 step 内部异步操作后随时调用 */
        isLatest: () => mine === _competitionVersions[key],
    };
    for (const step of steps) {
        if (!ctx.isLatest()) return;
        if (typeof step === 'function') {
            prevResult = await step(prevResult, ctx);
        } else {
            prevResult = await step;
        }
    }
    return prevResult;
}
