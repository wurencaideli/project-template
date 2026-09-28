import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

/** 根据字符串生成格式化时间 参数："YYYY-MM-DD HH:mm:ss SSS" */
export function getFormatDate(fmt: string) {
    if (!fmt) return fmt;
    return dayjs().format(fmt);
}
/**
 * 将时间字符串转化为时间戳
 */
export function strToTimestamp(timeStr: string) {
    if (!timeStr) return timeStr;
    const date = new Date(timeStr);
    return date.getTime();
}
/**
 * 将时间戳转化为字符格式的时间
 */
export function timestampToStr(timestamp: number | string, timeStr: string): string {
    if (!timestamp) return '';
    const ms = toMs(Number(timestamp));
    return dayjs(ms).format(timeStr);
}
export const weekList_zh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
export const weekList_en = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
/** 获取时间的日期 */
export function getDay(timestamp: number | string) {
    return dayjs(timestamp).day();
}
/** 将时间戳转换为毫秒 */
export function toMs(ts: number) {
    if (typeof ts !== 'number' || !ts) return ts;
    return ts < 1e12 ? ts * 1000 : ts;
}
