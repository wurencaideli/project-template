/** 防抖（immediate=true代表只执行第一次和最后一次） */
export function debounceFn(fn: Function, delay?: number, immediate?: boolean) {
    delay = delay || 200;
    let timer: ReturnType<typeof setTimeout> | undefined;
    return function (this: any) {
        const that = this;
        const args = arguments;
        if (timer === undefined && immediate) {
            //如果是第一次则执行
            timer = setTimeout(() => {
                timer = undefined;
            }, delay);
            fn.apply(that, args);
        } else {
            clearTimeout(timer);
            timer = setTimeout(function () {
                timer = undefined;
                fn.apply(that, args);
            }, delay);
        }
    };
}
/* 节流 */
export function throttleFn(fn: Function, interval?: number) {
    let last: number | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    interval = interval || 200;
    return function (this: any) {
        var th = this;
        var args = arguments;
        var now = +new Date();
        if (last && now - last < interval) {
            clearTimeout(timer);
            timer = setTimeout(function () {
                last = now;
                fn.apply(th, args);
            }, interval);
        } else {
            last = now;
            fn.apply(th, args);
        }
    };
}
