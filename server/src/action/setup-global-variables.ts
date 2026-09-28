import { compressHtml } from '../common/build-tools.js';

const data: any = {
    html404Str: compressHtml('404'),
};
/** 设置全局变量 */
export function setGlobalVariables(key: string, value: any) {
    (data as any)[key] = value;
}
export function getGlobalVariables(key: string) {
    return data[key];
}
