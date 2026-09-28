import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import 'dayjs/locale/zh-cn.js';

dayjs.locale('zh-cn');
dayjs.extend(customParseFormat);

/** 根据字符串生成格式化时间 参数："YYYY-MM-DD HH:mm:ss SSS" */
export function getFormatDate(fmt: string): string {
    if (!fmt) return fmt;
    return dayjs().format(fmt);
}
/**
 * 将时间字符串转化为时间戳
 */
export function strToTimestamp(timeStr: string): number {
    const date = new Date(timeStr);
    return date.getTime();
}
/**
 * 将时间戳转化为字符格式的时间
 */
export function timestampToStr(timestamp: number, timeStr: string) {
    return dayjs(timestamp).format(timeStr);
}
/**
 * 验证时间格式是否正确，date的格式是否是format
 * date :2022-12-12-03-04-130
 * format :YYYY-MM-DD-HH-mm-ss-SSS
 * 返回一个dayjs实例，可以调用valueOf()获取时间戳
 */
export function validDateFormat(date: string, format: string): any {
    const dayjsObject = dayjs(date, format, true);
    if (dayjsObject.isValid() && dayjsObject.format(format) === date) {
        return dayjsObject;
    } else {
        return false;
    }
}
