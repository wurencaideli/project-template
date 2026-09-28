import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import justPick from 'just-pick';

import { vToken, vAdmin } from '../action/api-middleware.js';
import * as friendlyLinkServer from '../service/friendly-link.js';
import { PublicReturn } from '../common/public-return.js';
import {
    friendlyLinkAddValidatorFn,
    friendlyLinkUpdateValidatorFn,
} from '../action/verified-option.js';
import { createUuid } from '../common/uuid-tools.js';
import { toBoolean } from '../common/other-tools.js';

export function createRouter(fastify: FastifyInstance) {
    fastify.get(
        '/friendly-link/list',
        {
            preHandler: vToken,
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const params: any = request.query || {};
            const page = Math.abs(parseInt(params.page)) || 1;
            const size = Math.abs(parseInt(params.size)) || 10;
            const sortBy = [
                {
                    desc: (u: any) => {
                        return u.initDate;
                    },
                },
            ];
            const searchBy: any = {};
            if (Object.prototype.hasOwnProperty.call(params, 'name') && params.name !== '') {
                searchBy['name'] = params.name;
            }
            if (Object.prototype.hasOwnProperty.call(params, 'link') && params.link !== '') {
                searchBy['link'] = params.link;
            }
            if (Object.prototype.hasOwnProperty.call(params, 'hidden') && params.hidden !== '') {
                searchBy['hidden'] = String(toBoolean(params.hidden));
            }
            const data = await friendlyLinkServer.list({
                page,
                size,
                sortBy,
                searchBy,
            });
            reply.send(
                new PublicReturn(200, '数据列表', {
                    list: data.list,
                    total: data.total,
                    page,
                    size,
                }),
            );
        },
    );
    fastify.get(
        '/friendly-link/info/:uId',
        {
            preHandler: vToken,
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const params: any = request.params || {};
            const data = await friendlyLinkServer.findByUId(params.uId);
            if (!data) {
                reply.code(404).send(new PublicReturn(404, '获取失败: 什么也没找到'));
                return;
            }
            reply.send(new PublicReturn(200, '成功', data));
        },
    );
    fastify.post(
        '/friendly-link/add',
        {
            preHandler: vAdmin,
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const params: any = justPick(request.body || {}, [
                'name',
                'link',
                'icon',
                'content',
                'hidden',
            ] as any);
            const verifiedData = friendlyLinkAddValidatorFn(params);
            if (verifiedData) {
                reply.code(400).send(new PublicReturn(400, verifiedData));
                return;
            }
            const target = await friendlyLinkServer.findByName(params.name);
            if (target) {
                reply.code(409).send(new PublicReturn(409, '添加失败: 重复数据'));
                return;
            }
            params.uId = createUuid();
            params.initDate = new Date().getTime();
            await friendlyLinkServer.add(params);
            reply.send(new PublicReturn(200, '成功', params));
        },
    );
    fastify.put(
        '/friendly-link/update',
        {
            preHandler: vAdmin,
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const mustKeys: any = ['uId', 'link', 'icon', 'content', 'hidden'];
            const params: any = justPick(request.body || {}, mustKeys);
            const verifiedData = friendlyLinkUpdateValidatorFn(params);
            if (verifiedData) {
                reply.code(400).send(new PublicReturn(400, verifiedData));
                return;
            }
            const target = await friendlyLinkServer.findByUId(params.uId);
            if (!target) {
                reply.code(404).send(new PublicReturn(404, '修改失败: 未找到相应数据'));
                return;
            }
            params.updateDate = new Date().getTime();
            await friendlyLinkServer.update(target, params);
            reply.send(new PublicReturn(200, '成功', params));
        },
    );
    fastify.delete(
        '/friendly-link/:uIds',
        {
            preHandler: vAdmin,
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const params: any = request.params || {};
            const ids = (params.uIds || '').split(',');
            if (ids.length == 0) {
                reply.code(400).send(new PublicReturn(400, '参数不能为空'));
                return;
            }
            const list = await friendlyLinkServer.findByUIds(ids);
            await friendlyLinkServer.delete_(list);
            reply.send(new PublicReturn(200, '成功'));
        },
    );
}