/**
 * 自定义事件，基于
 * https://www.npmjs.com/package/mitt
 */
import mitt from 'mitt';

const eventInstanceMap = {}; //所有事件实例
/**
 * 获取一个mitt实例，没有则创建一个
 */
export function getMittInstance(name) {
    eventInstanceMap[name] = eventInstanceMap[name] || mitt();
    return eventInstanceMap[name];
}
/**
 * 销毁实例
 */
export function destroyMittInstance(name) {
    if (eventInstanceMap[name]) {
        eventInstanceMap[name].all?.clear();
    }
    delete eventInstanceMap[name];
}
