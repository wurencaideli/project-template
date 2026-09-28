import { isFullscreen, elementFullscreen, exitFullscreen, createUuid } from './common.utils';

/** 设置元素全屏 */
export function setupElFullScreen(el: HTMLElement, callback: any) {
    callback(isFullscreen(el));
    function fullScreenHandle_() {
        callback(isFullscreen(el));
    }
    document.addEventListener('fullscreenchange', fullScreenHandle_);
    document.addEventListener('webkitfullscreenchange', fullScreenHandle_);
    document.addEventListener('mozfullscreenchange', fullScreenHandle_);
    document.addEventListener('msfullscreenchange', fullScreenHandle_);
    // 销毁
    function destroy() {
        document.removeEventListener('fullscreenchange', fullScreenHandle_);
        document.removeEventListener('webkitfullscreenchange', fullScreenHandle_);
        document.removeEventListener('mozfullscreenchange', fullScreenHandle_);
        document.removeEventListener('msfullscreenchange', fullScreenHandle_);
    }
    // 切换全屏
    function switch_() {
        if (isFullscreen(el)) {
            exitFullscreen();
        } else {
            elementFullscreen(el);
        }
    }
    return {
        switch: switch_,
        destroy,
    };
}
/** 创建或读取 tabpageUuid,用于跨标签页通信标识 */
export function setupSessionId() {
    let id = window.sessionStorage.getItem('tabpageUuid');
    if (!id) {
        id = createUuid();
        window.sessionStorage.setItem('tabpageUuid', id);
    }
    return id;
}
let bc: BroadcastChannel;
/** 创建到 chatbot 的广播通道(单例) */
export function createBroadcastChannel() {
    if (bc) return bc;
    bc = new BroadcastChannel('Broadcast-to-Chatbot');
    return bc;
}