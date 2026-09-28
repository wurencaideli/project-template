export function isPro(): boolean {
    return process.env.NODE_ENV === 'production';
}
export function deepCopy(data: any) {
    return JSON.parse(JSON.stringify(data));
}
/**
 * 获取数据的类型
 */
export function getValueType(value: any): string {
    return Object.prototype.toString.call(value);
}
/** 随机获取一个元素 */
export function getRandomElement(arr: Array<any>): any {
    const randomIndex = Math.floor(Math.random() * arr.length);
    return arr[randomIndex];
}
/** 参数转化为Boolean */
export function toBoolean(value: any): boolean {
    if (!value || value == 'false' || value == 0) {
        value = false;
    } else {
        value = true;
    }
    return value;
}
/** 分割数组 */
export function chunkArray(arr: Array<any>, chunkSize: number) {
    const result = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize);
        result.push(chunk);
    }
    return result;
}
/** 添加路由参数 */
export function addRouteParam(url: string, params: Record<string, string | number>): string {
    const validParams: Record<string, string> = {};
    Object.entries(params).forEach(([k, v]) => {
        if (v != null) validParams[k] = String(v);
    });
    try {
        const urlObj = new URL(url);
        Object.entries(validParams).forEach(([k, v]) => {
            urlObj.searchParams.set(k, v);
        });
        return urlObj.toString();
    } catch {
        const hashIndex = url.indexOf('#');
        const hash = hashIndex !== -1 ? url.slice(hashIndex) : '';
        const beforeHash = hashIndex !== -1 ? url.slice(0, hashIndex) : url;
        const [pathname, search = ''] = beforeHash.split('?');
        const searchParams = new URLSearchParams(search);
        Object.entries(validParams).forEach(([k, v]) => {
            searchParams.set(k, v);
        });
        const newSearch = searchParams.toString();
        let res = pathname;
        if (newSearch) res += '?' + newSearch;
        return res + hash;
    }
}
