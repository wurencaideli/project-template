/**
 * 根据配置信息复制对象
 * @param {{}} [data={}] 需要复制的对象
 * @param {{}} [dataOrigin={}] 数据源对象
 * @param {{}} [options={}] 需要复制的key的配置
 * @returns {{}} 返回数据
 */
export function copyDefaults(data: any = {}, dataOrigin: any = {}, options: any = {}) {
    const dataOriginKeys = Object.keys(dataOrigin);
    const optionKeys = Object.keys(options);
    /** 遍历源对象，将部分属性复制到data上 */
    dataOriginKeys.concat(optionKeys).forEach((key) => {
        const hasOwnKey = dataOrigin.hasOwnProperty(key);
        const hasOptionsKey = options.hasOwnProperty(key);
        if (hasOwnKey) {
            data[key] = dataOrigin[key];
            return;
        }
        if (!hasOptionsKey) return;
        if (typeof options[key].default == 'function') {
            data[key] = options[key].default();
        } else {
            data[key] = options[key].default;
        }
    });
    return data;
}
