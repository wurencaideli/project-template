import { describe, it, expect } from 'vitest';
import { timestampToStr, getDay, strToTimestamp, toMs, weekList_en, weekList_zh } from './date.util';

describe('date.util', () => {
    describe('timestampToStr', () => {
        it('formats a known ms timestamp to YYYY-MM-DD HH:mm:ss', () => {
            // 2024-01-02 03:04:05 UTC
            const ts = Date.UTC(2024, 0, 2, 3, 4, 5);
            const out = timestampToStr(ts, 'YYYY-MM-DD HH:mm:ss');
            // dayjs 默认使用本地时区,只断言格式与字段顺序
            expect(out).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
        });

        it('returns empty string for falsy timestamps', () => {
            expect(timestampToStr(0, 'YYYY')).toBe('');
            expect(timestampToStr('', 'YYYY')).toBe('');
        });
    });

    describe('getDay', () => {
        it('returns 0..6 for the day of week', () => {
            const day = getDay(Date.UTC(2024, 0, 7)); // Sunday UTC
            expect(day).toBeGreaterThanOrEqual(0);
            expect(day).toBeLessThanOrEqual(6);
        });
    });

    describe('strToTimestamp', () => {
        it('converts a parseable date string to ms', () => {
            const ts = strToTimestamp('2024-01-02T00:00:00Z');
            expect(typeof ts).toBe('number');
            expect(ts).toBeGreaterThan(0);
        });
    });

    describe('toMs', () => {
        it('multiplies seconds <1e12 to milliseconds', () => {
            const sec = 1_700_000_000;
            expect(toMs(sec)).toBe(sec * 1000);
        });
        it('passes through values already in ms', () => {
            const ms = 1_700_000_000_000;
            expect(toMs(ms)).toBe(ms);
        });
    });

    describe('week list parity', () => {
        it('keeps zh and en lists aligned in length', () => {
            expect(weekList_zh.length).toBe(weekList_en.length);
            expect(weekList_zh.length).toBe(7);
        });
    });
});
