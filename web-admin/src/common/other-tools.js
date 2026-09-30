import copy from 'copy-to-clipboard';

export function setBaseSize(baseSize) {
    baseSize = Number(baseSize) || 16;
    let fontSize = Math.round(baseSize) + 'px';
    if (document.documentElement.style.fontSize == fontSize) return;
    document.documentElement.style.fontSize = fontSize;
}
/**是否是pc端 */
export function isPc() {
    let userAgent = navigator.userAgent;
    let Agents = ['Android', 'iPhone', 'SymbianOS', 'Windows Phone', 'iPad', 'iPod'];
    return !Agents.some((i) => {
        return userAgent.includes(i);
    });
}
/**
 * 深度复制一个对象
 * 最简单的实现方式
 */
export function deepCopyObj(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * copy value
 * 数据粘贴板复制
 */
export function copyValue(value) {
    copy(value);
}
/** 是空的*/
export function isEmpty(value) {
    return !value && value !== 0;
}
/**
 * 加载脚本,样式
 */
export function loadScript(url, type) {
    return new Promise((r, j) => {
        let el;
        switch (type) {
            case 'css':
                el = document.createElement('link');
                el.rel = 'stylesheet';
                el.href = url;
                break;
            case 'js':
                el = document.createElement('script');
                el.type = 'text/javascript';
                el.src = url;
                break;
        }
        document.head.appendChild(el);
        el.onload = () => {
            r();
        };
        el.onerror = () => {
            j();
        };
    });
}
/** 是否是生产环境 */
export function isProd() {
    return import.meta.env.PROD;
}
/** 全屏事件 */
export function toggleFullScreen() {
    var elem = document.documentElement; // 获取文档根元素
    if (
        !document.fullscreenElement && // 当前不在全屏模式
        !document.mozFullScreenElement &&
        !document.webkitFullscreenElement &&
        !document.msFullscreenElement
    ) {
        // 也适用于IE/Edge
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            // Firefox
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            // Chrome, Safari, and Opera
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            // IE/Edge
            elem.msRequestFullscreen();
        }
    } else {
        // 当前在全屏模式，退出全屏
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            // Firefox
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            // Chrome, Safari, and Opera
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            // IE/Edge
            document.msExitFullscreen();
        }
    }
}
/** 获取数据的类型 */
export function getTypeOf(value) {
    return Object.prototype.toString.call(value);
}
/** 去除首尾空格 */
export function toTrim(str) {
    str = (str || '').replace(/^\s+|\s+$/g, '');
    return str;
}
