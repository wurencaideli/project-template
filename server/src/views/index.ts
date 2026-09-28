import path from 'path';
import { FastifyInstance, FastifyReply } from 'fastify';
import fastifyStatic from '@fastify/static';
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';

import { getGlobalVariables } from '../action/setup-global-variables.js';
import { PublicReturn } from '../common/public-return.js';
import { createRouter as createPublicRouter } from './public.js';
import { createRouter as createSystemRouter } from './system.js';
import { createRouter as createFriendlyLinkRouter } from './friendly-link.js';
import { createRouter as createUserRouter } from './user.js';
import { createRouter as createNoteRouter } from './note.js';
import { createRouter as createFileRouter } from './file.js';
import { createRouter as createSystemFileRouter } from './system-file.js';
import { createRouter as createWebRssRouter } from './web-rss.js';
import { createRouter as createWebSitemapRouter } from './web-sitemap.js';
import { createRouter as createWebRobotsRouter } from './web-robots.js';

/** 流式返回 SPA 的 index.html；文件不存在或异常时回 404 字符串 */
function createServeSpaIndex(distDirPath: string) {
    return async (_request: unknown, reply: FastifyReply) => {
        try {
            const htmlPath = path.join(distDirPath, 'index.html');
            const stream = fs.createReadStream(htmlPath);
            stream.on('error', () => {
                if (!reply.sent) {
                    reply.code(404).type('text/html').send(getGlobalVariables('html404Str'));
                }
            });
            reply.type('text/html');
            await pipeline(stream, reply.raw);
        } catch {
            if (!reply.sent) {
                reply.code(404).type('text/html').send(getGlobalVariables('html404Str'));
            }
        }
    };
}

export async function createRouter(fastify: FastifyInstance) {
    const webAdminDistDirPath: string = getGlobalVariables('webAdminDistDirPath');
    const angularUiDistDirPath: string = getGlobalVariables('angularUiDistDirPath');
    const uploadFilesDirPath: string = getGlobalVariables('uploadFilesDirPath');
    const systemUploadFilesDirPath: string = getGlobalVariables('systemUploadFilesDirPath');
    const PROJECT_BASE_HREF: string = process.env.PROJECT_BASE_HREF || '';
    const serveWebAdminIndex = createServeSpaIndex(webAdminDistDirPath);
    const serveAngularUiIndex = createServeSpaIndex(angularUiDistDirPath);
    await fastify.register(
        async (instance) => {
            instance.get('/', async (_request, reply) => {
                return reply.code(404).send(new PublicReturn(404, '接口 404 未注册', ''));
            });
            await createPublicRouter(instance);
            await createUserRouter(instance);
            await createSystemRouter(instance);
            await createFriendlyLinkRouter(instance);
            await createNoteRouter(instance);
            await createFileRouter(instance);
            await createSystemFileRouter(instance);
            instance.all('/*', async (_request, reply) => {
                return reply.code(404).send(new PublicReturn(404, '接口 404 未注册', ''));
            });
        },
        { prefix: `${PROJECT_BASE_HREF}api` },
    );
    await fastify.register(
        async (instance) => {
            instance.setNotFoundHandler(async (request, reply) => {
                reply.code(404);
                return new PublicReturn(404, '未找到相应文件', '');
            });
            await instance.register(fastifyStatic, {
                root: uploadFilesDirPath,
                index: false,
                list: false,
                cacheControl: true,
                maxAge: 31536000,
            });
        },
        { prefix: `${PROJECT_BASE_HREF}api/file/info` },
    );
    await fastify.register(
        async (instance) => {
            instance.setNotFoundHandler(async (request, reply) => {
                reply.code(404);
                return new PublicReturn(404, '未找到相应文件', '');
            });
            await instance.register(fastifyStatic, {
                root: systemUploadFilesDirPath,
                index: false,
                list: false,
                cacheControl: true,
                maxAge: 31536000,
            });
        },
        { prefix: `${PROJECT_BASE_HREF}api/system-file/info` },
    );
    await fastify.register(
        async (instance) => {
            instance.get('/', serveWebAdminIndex);
            instance.setNotFoundHandler(serveWebAdminIndex);
            await instance.register(fastifyStatic, {
                root: webAdminDistDirPath,
                index: false,
                list: false,
                cacheControl: true,
                maxAge: 31536000,
                setHeaders: (res, requestPath) => {
                    const filename = path.basename(requestPath);
                    if (filename === 'index.html') {
                        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                    }
                },
            });
        },
        { prefix: `${PROJECT_BASE_HREF}web-admin` },
    );
    await fastify.register(
        async (instance) => {
            instance.get('/', serveAngularUiIndex);
            await createWebRssRouter(instance);
            await createWebSitemapRouter(instance);
            await createWebRobotsRouter(instance);
            instance.setNotFoundHandler(serveAngularUiIndex);
            await instance.register(fastifyStatic, {
                root: angularUiDistDirPath,
                index: false,
                list: false,
                cacheControl: true,
                maxAge: 31536000,
                setHeaders: (res, requestPath) => {
                    const filename = path.basename(requestPath);
                    if (filename === 'index.html') {
                        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                    }
                },
            });
        },
        { prefix: `${PROJECT_BASE_HREF}` },
    );
}
