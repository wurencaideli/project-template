import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import justPick from 'just-pick';

import { vToken } from '../action/api-middleware.js';
import * as noteServer from '../service/note.js';
import { PublicReturn } from '../common/public-return.js';
import {
    noteAddValidatorFn,
    noteUpdateValidatorFn,
} from '../action/verified-option.js';
import { createUuid } from '../common/uuid-tools.js';
import { toBoolean } from '../common/other-tools.js';

export function createRouter(fastify: FastifyInstance) {
    fastify.get(
        '/note/list',
        {
            preHandler: vToken,
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const params: any = request.query || {};
            const page = Math.abs(parseInt(params.page)) || 1;
            const size = Math.abs(parseInt(params.size)) || 10;
            const sortBy: any = [];
            if (params.sortBy === 'pinned') {
                sortBy.push(['pinned', 'DESC']);
            }
            sortBy.push(['initDate', 'DESC']);
            const searchBy: any = {};
            if (Object.prototype.hasOwnProperty.call(params, 'title') && params.title !== '') {
                searchBy['title'] = params.title;
            }
            if (Object.prototype.hasOwnProperty.call(params, 'hidden') && params.hidden !== '') {
                searchBy['hidden'] = String(toBoolean(params.hidden));
            }
            if (Object.prototype.hasOwnProperty.call(params, 'pinned') && params.pinned !== '') {
                searchBy['pinned'] = String(toBoolean(params.pinned));
            }
            const where: any = {};
            const userInfo: any = (request as any).userInfo || {};
            /** 非 admin 只看自己 + 公开的（hidden=false） */
            if (userInfo.userRole !== 'admin') {
                where.userUId = userInfo.userUId;
                if (params.scope !== 'all') {
                    where.hidden = false;
                }
            }
            const data = await noteServer.list({
                page,
                size,
                sortBy,
                searchBy,
                where,
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
        '/note/info/:uId',
        {
            preHandler: vToken,
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const params: any = request.params || {};
            const data: any = await noteServer.findById(params.uId);
            if (!data) {
                reply.code(404).send(new PublicReturn(404, '获取失败: 什么也没找到'));
                return;
            }
            const userInfo: any = (request as any).userInfo || {};
            if (data.hidden && userInfo.userRole !== 'admin' && data.userUId !== userInfo.userUId) {
                reply.code(403).send(new PublicReturn(403, '无权查看此日记'));
                return;
            }
            reply.send(new PublicReturn(200, '成功', data));
        },
    );
    fastify.post(
        '/note/add',
        {
            preHandler: vToken,
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const params: any = justPick(request.body || {}, [
                'title',
                'content',
                'hidden',
                'pinned',
            ] as any);
            const verifiedData = noteAddValidatorFn(params);
            if (verifiedData) {
                reply.code(400).send(new PublicReturn(400, verifiedData));
                return;
            }
            const userInfo: any = (request as any).userInfo || {};
            const now = new Date().getTime();
            const newNote: any = {
                uId: createUuid(),
                userUId: userInfo.userUId,
                title: params.title || '',
                content: params.content,
                hidden: !!params.hidden,
                pinned: !!params.pinned,
                initDate: now,
                updateDate: now,
            };
            const created = await noteServer.add(newNote);
            reply.send(new PublicReturn(200, '成功', created));
        },
    );
    fastify.put(
        '/note/update',
        {
            preHandler: vToken,
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const mustKeys: any = ['uId', 'title', 'content', 'hidden', 'pinned'];
            const params: any = justPick(request.body || {}, mustKeys);
            const verifiedData = noteUpdateValidatorFn(params);
            if (verifiedData) {
                reply.code(400).send(new PublicReturn(400, verifiedData));
                return;
            }
            const target: any = await noteServer.findById(params.uId);
            if (!target) {
                reply.code(404).send(new PublicReturn(404, '修改失败: 未找到相应数据'));
                return;
            }
            const userInfo: any = (request as any).userInfo || {};
            if (userInfo.userRole !== 'admin' && target.userUId !== userInfo.userUId) {
                reply.code(403).send(new PublicReturn(403, '无权修改此日记'));
                return;
            }
            params.updateDate = new Date().getTime();
            await noteServer.update(target, params);
            reply.send(new PublicReturn(200, '成功', params));
        },
    );
    fastify.delete(
        '/note/:ids',
        {
            preHandler: vToken,
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const params: any = request.params || {};
            const ids = (params.ids || '').split(',');
            if (ids.length == 0) {
                reply.code(400).send(new PublicReturn(400, '参数不能为空'));
                return;
            }
            const userInfo: any = (request as any).userInfo || {};
            const list = await noteServer.filter((item: any) => {
                if (!ids.includes(item.uId)) return false;
                if (userInfo.userRole === 'admin') return true;
                return item.userUId === userInfo.userUId;
            });
            await noteServer.delete_(list);
            reply.send(new PublicReturn(200, '成功'));
        },
    );
}
