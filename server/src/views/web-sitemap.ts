import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import mime from 'mime';
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';

import { PublicReturn } from '../common/public-return.js';
import { getGlobalVariables } from '../action/setup-global-variables.js';

export function createRouter(fastify: FastifyInstance) {
    const sitemapXmlPath = getGlobalVariables('sitemapXmlPath');
    const __ = async function (request: FastifyRequest, reply: FastifyReply) {
        reply.headers({
            'Content-Type': mime.getType(getGlobalVariables('sitemapXmlPath')) || '',
        });
        const stream = fs.createReadStream(sitemapXmlPath);
        stream.on('error', (err) => {
            reply.code(404).send(new PublicReturn(404, '没找到文件 sitemap.xml'));
        });
        await pipeline(stream, reply.raw);
    };
    fastify.get('/sitemap.xml', __);
    fastify.get('/siteMap.xml', __);
    fastify.get('/SiteMap.xml', __);
}
