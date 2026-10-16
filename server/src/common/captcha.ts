import svgCaptcha from 'svg-captcha';

import { createUuid } from './uuid-tools.js';

const captchaMap = new Map();
type SvgCaptcha = {
    svg: string;
    key: string;
};
/**
 * 创建一个验证码
 */
export function create(): SvgCaptcha {
    const captcha = svgCaptcha.create({
        size: 4,
        ignoreChars: 'O0o1iIl',
        noise: 20,
        color: true,
        background: '#cc9966',
    });
    const uuid = createUuid();
    captchaMap.set(uuid, {
        key: uuid,
        value: captcha.text.toLowerCase(),
        overtime: new Date().getTime() + 1000 * 60 * 7,
    });
    return {
        svg: captcha.data,
        key: uuid,
    };
}
/**
 * 验证，不考虑验证码过期
 */
export function verify(key: string, value: string): boolean {
    const p = captchaMap.get(key);
    if (!p) return false;
    value = value + '';
    value = value.toLowerCase();
    if (p.value !== value) return false;
    captchaMap.delete(key);
    return true;
}
/**
 * 清除已过期的，由外部的定时任务清除
 */
export function verifyOverTime() {
    const nowDate = new Date().getTime();
    captchaMap.forEach((item) => {
        if (item.overtime >= nowDate) return;
        captchaMap.delete(item.key);
    });
}
