import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { initSql } from '../entity/index.js';
import { createBaseUserData } from '../service/user.js';
import { init as initToken } from '../service/token.js';
import { vToken } from '../action/api-middleware.js';
import { PublicReturn } from '../common/public-return.js';
import { getReqLimiter } from '../action/req-limiter.js';
import { update as updateRss } from '../service/rss.js';
import { update as updateSitemap } from '../service/sitemap.js';

export async function createRouter(fastify: FastifyInstance) {
    /**
     * 初始化数据源
     */
    await fastify.post(
        '/system/init-data',
        {
            preHandler: [vToken, getReqLimiter(1, 1000 * 10)],
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            await initSql();
            await createBaseUserData().catch(() => {});
            await initToken();
            reply.send(new PublicReturn(200, '更新成功'));
        },
    );
    /**
     * 生成rss
     */
    await fastify.put(
        '/system/rss/update',
        {
            preHandler: [vToken, getReqLimiter(1, 1000 * 3)],
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            await updateRss();
            reply.send(new PublicReturn(200, '更新成功'));
        },
    );
    /**
     * 生成sitemap
     */
    await fastify.put(
        '/system/sitemap/update',
        {
            preHandler: [vToken, getReqLimiter(1, 1000 * 3)],
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            await updateSitemap();
            reply.send(new PublicReturn(200, '更新成功'));
        },
    );
}
