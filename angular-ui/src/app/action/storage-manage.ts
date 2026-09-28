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
