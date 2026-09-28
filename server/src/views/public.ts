import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { create as captchaCreate } from '../common/captcha.js';
import { PublicReturn } from '../common/public-return.js';
import { getReqLimiter } from '../action/req-limiter.js';
import { getPublicKey } from '../common/rsa-tools.js';

export async function createRouter(fastify: FastifyInstance) {
    /**
     * 获取验证码
     */
    await fastify.get(
        '/public/captcha',
        {
            preHandler: getReqLimiter(10, 1000 * 3),
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const captcha = captchaCreate();
            reply.send(new PublicReturn(200, '成功', captcha));
        },
    );
    /**
     * 获取rsa公钥
     */
    await fastify.get(
        '/public/rsa-public-key',
        {
            preHandler: getReqLimiter(10, 1000 * 3),
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            reply.send(new PublicReturn(200, '成功', getPublicKey()));
        },
    );
}
