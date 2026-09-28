import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export function createRouter(fastify: FastifyInstance) {
    const { PROJECT_DOMAIN } = process.env;
    const PROJECT_BASE_HREF = process.env.PROJECT_BASE_HREF || '/';
    fastify.get('/robots.txt', async function (request: FastifyRequest, reply: FastifyReply) {
        reply
            .type('text/plain')
            .send(
                [
                    'User-agent: *',
                    `Disallow: ${PROJECT_BASE_HREF}web-admin`,
                    `Disallow: ${PROJECT_BASE_HREF}api/file/`,
                    `Sitemap: https://${PROJECT_DOMAIN}${PROJECT_BASE_HREF}sitemap.xml`,
                    '',
                ].join('\n'),
            );
    });
}
