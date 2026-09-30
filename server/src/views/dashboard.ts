import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { PublicReturn } from '../common/public-return.js';

/**
 * 大屏(dashboard)统计接口:模板无真实业务数据,统一返回随机值。
 * 返回体走 PublicReturn 信封,数据负载在 data 字段。
 */
/** [min, max] 区间随机整数 */
function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/** 枚举 [startTime, endTime](时间戳)内的日期字符串 'YYYY-MM-DD',上限 92 天 */
function eachDay(startTime: unknown, endTime: unknown) {
    const start = new Date(Number(startTime));
    const end = new Date(Number(endTime));
    const days: string[] = [];
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return days;
    for (let d = new Date(start); d <= end && days.length < 92; d.setDate(d.getDate() + 1)) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        days.push(`${y}-${m}-${day}`);
    }
    return days;
}

export async function createRouter(fastify: FastifyInstance) {
    /**
     * 顶部汇总卡片统计。约定:卡片 N 的数值字段为 numberN,说明文字字段为 textN,走势数组字段为 chartN(近 24 小时)
     */
    await fastify.post(
        '/dashboard/summary',
        async function (request: FastifyRequest, reply: FastifyReply) {
            const chart = (min: number, max: number) =>
                Array.from({ length: 24 }, () => randomInt(min, max));
            const data = {
                number1: randomInt(100, 999),
                number2: randomInt(10, 99),
                number3: randomInt(10, 99),
                number4: randomInt(1, 24),
                chart1: chart(100, 999),
                chart2: chart(10, 99),
                chart3: chart(10, 99),
                chart4: chart(1, 24),
                text1: '数据内容说明1',
                text2: '数据内容说明2',
                text3: '数据内容说明3',
                text4: '数据内容说明4',
            };
            reply.send(new PublicReturn(200, '成功', data));
        },
    );
    /**
     * 按天统计。约定:入参 startTime/endTime 为时间戳,day 为 'YYYY-MM-DD',系列 N 的数量字段为 countN
     */
    await fastify.post(
        '/dashboard/daily-count',
        async function (request: FastifyRequest, reply: FastifyReply) {
            const params: any = request.body || {};
            const data = eachDay(params.startTime, params.endTime).map((day) => ({
                day,
                count1: randomInt(10, 200),
                count2: randomInt(5, 120),
            }));
            reply.send(new PublicReturn(200, '成功', data));
        },
    );
    /**
     * 分类统计(柱状图)。约定:类目字段为 name(「类别N」占位),数量字段为 count
     */
    await fastify.post(
        '/dashboard/category-count',
        async function (_request: FastifyRequest, reply: FastifyReply) {
            const data = Array.from({ length: 5 }, (_, i) => ({
                name: `类别${i + 1}`,
                count: randomInt(20, 200),
            }));
            reply.send(new PublicReturn(200, '成功', data));
        },
    );
    /**
     * 等级分布(饼图)。约定:等级字段 level 取值 '01'~'04',数量字段 count,一级数量最少
     */
    await fastify.post(
        '/dashboard/level-count',
        async function (_request: FastifyRequest, reply: FastifyReply) {
            const data = ['01', '02', '03', '04'].map((level) => ({
                level,
                count: randomInt(0, level === '01' ? 12 : 80),
            }));
            reply.send(new PublicReturn(200, '成功', data));
        },
    );
    /**
     * 类型统计(底部柱状图)。约定:类目字段为 name(「类别N」占位),数量字段为 count
     */
    await fastify.post(
        '/dashboard/type-count',
        async function (_request: FastifyRequest, reply: FastifyReply) {
            const data = Array.from({ length: 6 }, (_, i) => ({
                name: `类别${i + 1}`,
                count: randomInt(5, 120),
            }));
            reply.send(new PublicReturn(200, '成功', data));
        },
    );
    /**
     * 区域统计(地图):一次请求返回全部区域数据。约定:入参 regions 传区域名列表,返回 name/count
     */
    await fastify.post(
        '/dashboard/region-count',
        async function (request: FastifyRequest, reply: FastifyReply) {
            const params: any = request.body || {};
            const regions: string[] = Array.isArray(params.regions) ? params.regions : [];
            const data = regions.map((name) => ({
                name,
                count: randomInt(0, 150),
            }));
            reply.send(new PublicReturn(200, '成功', data));
        },
    );
    /**
     * 大屏模板配置:标题/地图类型
     */
    await fastify.post(
        '/dashboard/config',
        async function (_request: FastifyRequest, reply: FastifyReply) {
            const data = {
                titleZh: '数据统计大屏',
                titleCh: '数据统计大屏',
                titleEn: 'Data Statistics Dashboard',
                mapType: 'shandong',
            };
            reply.send(new PublicReturn(200, '成功', data));
        },
    );
}
