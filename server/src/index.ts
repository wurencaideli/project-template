import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import fastifyMultipart from '@fastify/multipart';
import dotenv from 'dotenv';
import path from 'path';
import ip from 'ip';
import { program } from 'commander';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isPro } from './common/other-tools.js';
import { ensureDir } from './common/file-tools.js';
import { start as timingJobStart, addJob } from './timing-job/index.js';
import { createRouter } from './views/index.js';
import { initSql } from './entity/index.js';
import { createBaseUserData } from './service/user.js';
import { init as initToken } from './service/token.js';
import { setGlobalVariables, getGlobalVariables } from './action/setup-global-variables.js';
import { injectionResourcesPath } from './action/setup-resources-path.js';
import { verifyOverTime as reqLimiterVerifyOverTime } from './action/req-limiter.js';
import { verifyOverTime as captchaVerifyOverTime } from './common/captcha.js';
import { generateRSAKeyPair } from './common/rsa-tools.js';
import { PublicReturn } from './common/public-return.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
interface Option {
    model: 'dev' | 'pro';
}
/** 初始化服务 */
export async function start() {
    console.log(`当前环境: ${isPro() ? 'pro' : 'dev'}`);
    const port = process.env.PROJECT_PORT;
    const ipAddress = ip.address();
    await ensureDir(getGlobalVariables('serverDataRootDirPath'));
    await ensureDir(getGlobalVariables('uploadFilesDirPath'));
    await ensureDir(getGlobalVariables('systemUploadFilesDirPath'));
    await initSql()
        .then(async () => {
            console.log('数据系统: 初始化完成');
            await createBaseUserData().catch(() => {});
            await initToken();
        })
        .catch((e) => {
            console.log('数据系统: 初始化失败 ' + e);
        });
    generateRSAKeyPair();
    const fastify: FastifyInstance = Fastify({
        trustProxy: true,
        logger: isPro()
            ? false
            : {
                  level: 'debug',
              },
        bodyLimit: 1024 * 1024 * 3,
        routerOptions: {
            ignoreTrailingSlash: true,
            maxParamLength: 500,
        },
    });
    fastify.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
        reply.code(404).type('text/html').send(getGlobalVariables('html404Str'));
    });
    fastify.setErrorHandler((err: any, request: FastifyRequest, reply: FastifyReply) => {
        const statusCode = err?.statusCode || 500;
        reply.status(statusCode).send(new PublicReturn(statusCode, String(err), ''));
    });
    await fastify.register(cors, {
        origin: true,
    });
    await fastify.register(fastifyMultipart, {
        limits: { fileSize: 1024 * 1024 * 70 },
    });
    await fastify.register(formbody, {
        bodyLimit: 3 * 1024 * 1024,
    });
    await createRouter(fastify);
    await fastify.listen({ port: Number(port), host: '0.0.0.0' });
    console.log(`服务启动: http://localhost:${port}`);
    console.log(`服务启动: http://127.0.0.1:${port}`);
    console.log(`服务启动: http://${ipAddress}:${port}`);
    /** 注入定时任务 */
    addJob('time-3', async () => {
        reqLimiterVerifyOverTime();
        captchaVerifyOverTime();
        await initToken();
    });
    timingJobStart();
}
program
    .version('1.0.0')
    .description('--')
    .option('-m, --model <model>', '运行环境')
    .action((p: Option) => {
        const isPro__ = p.model == 'pro';
        dotenv.config({
            path: isPro__
                ? path.join(__dirname, '../.env.production')
                : path.join(__dirname, '../.env.development'),
            quiet: true,
        });
        setGlobalVariables('serverRootDirPath', path.join(__dirname, '../'));
        injectionResourcesPath();
        start();
    })
    .parse(process.argv);
