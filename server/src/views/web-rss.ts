import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import mime from 'mime';
import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';

import { PublicReturn } from '../common/public-return.js';
import { getGlobalVariables } from '../action/setup-global-variables.js';

export function createRouter(fastify: FastifyInstance) {
    const rssXmlPath = getGlobalVariables('rssXmlPath');
    fastify.get('/rss.xml', async function (request: FastifyRequest, reply: FastifyReply) {
        reply.headers({
            'Content-Type': mime.getType(getGlobalVariables('rssXmlPath')) || '',
        });
        const stream = fs.createReadStream(rssXmlPath);
        stream.on('error', (err) => {
            reply.code(404).send(new PublicReturn(404, '没找到文件 rss.xml'));
        });
        await pipeline(stream, reply.raw);
    });
}
