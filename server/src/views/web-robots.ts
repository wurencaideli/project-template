import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export function createRouter(fastify: FastifyInstance) {
    const { DUMOGU_Domain } = process.env;
    fastify.get('/robots.txt', async function (request: FastifyRequest, reply: FastifyReply) {
        reply
            .type('text/plain')
            .send(
                [
                    'User-agent: *',
                    'Disallow: /web-admin',
                    'Disallow: /api/file/',
                    `Sitemap: https://${DUMOGU_Domain}/sitemap.xml`,
                    '',
                ].join('\n'),
            );
    });
}
