/**
 * event-dashboard 用的 i18n 映射表。纯数据,与组件解耦,
 * 让组件可以单独 import 这些常量而不依赖 service。
 */

export type I18nRecord = Record<string, string>;
export type LocalePair = [string, string];

/**
 * 按 key 查找国际化文本。
 * @param map 形如 { 'en-US': { key: 'English text' }, 'zh-CN': { key: '中文' } } 的两层映射
 */
export function getI18nName(map: Record<string, I18nRecord>, key: string, lang: string): string {
    const layer = map[lang] || map['en-US'];
    return layer?.[key] ?? key;
}

/**
 * 针对 `[{ key, zh, en }, ...]` 形式的数组,根据 lang 返回对应字段。
 */
export function getI18nName_1(
    list: Array<LocalePair & { key: string }>,
    key: string,
    lang: string,
): string {
    const item = list.find((entry) => entry[0] === key);
    if (!item) return key;
    return lang.startsWith('zh') ? item[1] : item[2];
}

/** 事件等级 zh/en 文案 */
export const leaveMap: Array<LocalePair & { key: string }> = [
    { key: '01', 0: '01', 1: '一级告警', 2: 'Level 1 Alert' },
    { key: '02', 0: '02', 1: '二级告警', 2: 'Level 2 Alert' },
    { key: '03', 0: '03', 1: '三级告警', 2: 'Level 3 Alert' },
    { key: '04', 0: '04', 1: '四级告警', 2: 'Level 4 Alert' },
] as unknown as Array<LocalePair & { key: string }>;

/** 根因分类 zh/en 文案 */
export const rootCauseMap: Array<LocalePair & { key: string }> = [
    { key: 'POWER', 0: 'POWER', 1: '电源', 2: 'Power' },
    { key: 'TRANSMISSION', 0: 'TRANSMISSION', 1: '传输', 2: 'Transmission' },
    { key: 'CORE_NETWORK', 0: 'CORE_NETWORK', 1: '核心网', 2: 'Core Network' },
    { key: 'OTHERS', 0: 'OTHERS', 1: '其他', 2: 'Others' },
] as unknown as Array<LocalePair & { key: string }>;

/** 处理过程阶段 zh/en 文案 */
export const processMap: Array<LocalePair & { key: string }> = [
    { key: 'detected', 0: 'detected', 1: '已检测', 2: 'Detected' },
    { key: 'dispatched', 0: 'dispatched', 1: '已派单', 2: 'Dispatched' },
    { key: 'in_progress', 0: 'in_progress', 1: '处理中', 2: 'In Progress' },
    { key: 'resolved', 0: 'resolved', 1: '已恢复', 2: 'Resolved' },
] as unknown as Array<LocalePair & { key: string }>;

/** 地图区域到省份字段映射 */
export const provinceValueMap: Record<string, string> = {
    china: '中国',
    indonesia: '印度尼西亚',
    myanmar: '缅甸',
};

/** eventDataMap 占位:旧组件用 key 列举告警类型,这里用 object keys 兼容 */
export const eventDataMap: Record<string, true> = {};