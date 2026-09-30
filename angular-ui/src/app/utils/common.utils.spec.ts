import { describe, it, expect, vi } from 'vitest';
import { deepClone, isEnglish, delay, debounce } from './common.utils';

describe('common.utils', () => {
    describe('deepClone', () => {
        it('clones nested objects without sharing references', () => {
            const original = { a: 1, nested: { b: [1, 2, 3] } };
            const copy = deepClone(original);
            expect(copy).toEqual(original);
            expect(copy).not.toBe(original);
            expect(copy.nested).not.toBe(original.nested);
            expect(copy.nested.b).not.toBe(original.nested.b);
        });

        it('keeps Arrays as arrays (plain JSON-based deep clone)', () => {
            // 实现是 JSON.parse(JSON.stringify(...)),所以 Date/Map/Set 会被扁平化。
            // 这里只断言它确实在克隆、且不丢失数组这种 JSON 原生支持的结构。
            const original = { a: [1, 2, 3], nested: { b: 'x' } };
            const copy = deepClone(original);
            expect(Array.isArray(copy.a)).toBe(true);
            expect(copy.a).not.toBe(original.a);
            expect(copy).toEqual(original);
        });
    });

    describe('isEnglish', () => {
        it('returns true for en-US / en-*', () => {
            expect(isEnglish('en-US')).toBe(true);
            expect(isEnglish('en-GB')).toBe(true);
        });
        it('returns false for zh-* or other locales', () => {
            expect(isEnglish('zh-CN')).toBe(false);
            expect(isEnglish('zh-TW')).toBe(false);
            expect(isEnglish('fr-FR')).toBe(false);
        });
        it('returns true for en / en_US / EN-us / padded input', () => {
            expect(isEnglish('en')).toBe(true);
            expect(isEnglish('en_US')).toBe(true);
            expect(isEnglish('EN-us')).toBe(true);
            expect(isEnglish('  en-US  ')).toBe(true);
        });
        it('returns false for nullish / empty input or en-prefixed invalid codes', () => {
            expect(isEnglish(null)).toBe(false);
            expect(isEnglish(undefined)).toBe(false);
            expect(isEnglish('')).toBe(false);
            expect(isEnglish('enm')).toBe(false);
            expect(isEnglish('english')).toBe(false);
        });
    });

    describe('delay', () => {
        it('waits at least the requested time', async () => {
            const start = Date.now();
            await delay(20);
            expect(Date.now() - start).toBeGreaterThanOrEqual(15);
        });
    });

    describe('debounce', () => {
        it('invokes the wrapped function only once per call window', async () => {
            const spy = vi.fn();
            const wrapped = debounce(spy, 30);
            wrapped();
            wrapped();
            wrapped();
            await new Promise((r) => setTimeout(r, 60));
            expect(spy).toHaveBeenCalledTimes(1);
        });
    });
});
