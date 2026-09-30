import DumoguStorage from 'dumogu-storage';

/**
 * 所有实例，公共管理
 */
const allStorage: any = {};
function createS(key: string, value: any) {
    if (!allStorage[key]) {
        allStorage[key] = new DumoguStorage(key, value, { modelName: 'local' });
    }
    return allStorage[key];
}
export const useParamsStorage = () => {
    return createS('params-container', {});
};
/** 大屏(dashboard-one)缩放模式,'cover' | 'contain' */
export const useScalingModeStorage = () => {
    return createS('dashboard-one-scaling-mode', '');
};
/** 语言选项,'en-US' / 'zh-CN' */
export const useLanguageStorage = () => {
    return createS('language-option', '');
};
