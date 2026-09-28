import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import justPick from 'just-pick';

import * as apiMiddleware from '../action/api-middleware.js';
import * as userServer from '../service/user.js';
import * as tokenServer from '../service/token.js';
import * as userTools from '../common/user-tools.js';
import { PublicReturn } from '../common/public-return.js';
import * as uuidTools from '../common/uuid-tools.js';
import { getReqLimiter } from '../action/req-limiter.js';
import { userUpdateValidatorFn, userRegisterValidatorFn, userChangePasswordValidatorFn, userChangeSecretValidatorFn } from '../action/verified-option.js';
import { privateDecrypt } from '../common/rsa-tools.js';
import { getRandomElement } from '../common/other-tools.js';
import { sequelize } from '../entity/index.js';

export function createRouter(fastify: FastifyInstance) {
    fastify.post(
        '/user/register',
        {
            preHandler: [apiMiddleware.vCaptcha, getReqLimiter(1, 1000 * 3)],
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const params: any = justPick(request.body || {}, ['name', 'password', 'secret'] as any);
            params.password = privateDecrypt(params.password || '');
            params.secret = privateDecrypt(params.secret || '');
            const verifiedData = userRegisterValidatorFn(params);
            if (verifiedData) {
                reply.code(400).send(new PublicReturn(400, verifiedData));
                return;
            }
            const exist = await userServer.findByName(params.name);
            if (exist) {
                reply.code(409).send(new PublicReturn(409, '注册失败: 用户名已被占用'));
                return;
            }
            await sequelize.transaction(async (t: any) => {
                const saltRounds = getRandomElement([6, 7, 8, 9, 10, 11]);
                const now = new Date().getTime();
                const newUser: any = {
                    uId: uuidTools.createUuid(),
                    initDate: now,
                    updateDate: now,
                    name: params.name,
                    role: 'user',
                    nickname: params.name,
                    synopsis: '',
                    avatar: 'assets/public/user.jpg',
                    about: '',
                    password: userTools.hashPassword(params.password || '', saltRounds),
                    secret: userTools.hashPassword(params.secret || ''),
                };
                const user: any = await userServer.add(newUser, { transaction: t });
                const tokenInstance = {
                    uId: uuidTools.createUuid(),
                    userUId: user.uId,
                    userName: user.name,
                    userRole: user.role,
                    token: userTools.createToken() + '-|-' + user.uId,
                    initDate: now,
                };
                await tokenServer.add(tokenInstance, { transaction: t });
                reply.send(new PublicReturn(200, '成功', { token: tokenInstance.token }));
            });
        },
    );
    fastify.post(
        '/user/login',
        {
            preHandler: [apiMiddleware.vCaptcha, getReqLimiter(1, 1000 * 3)],
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const params: any = request.body || {};
            params.password = privateDecrypt(params.password || '');
            const user = await userServer.find((item: any) => item.name == params.name);
            if (!user) {
                reply.code(404).send(new PublicReturn(404, '没找到相应用户'));
                return;
            }
            if (!userTools.comparePassword(params.password || '', user.password || '')) {
                reply.code(400).send(new PublicReturn(400, '密码验证失败'));
                return;
            }
            const tokenInstance = {
                uId: uuidTools.createUuid(),
                userUId: user.uId,
                userName: user.name,
                userRole: user.role,
                token: userTools.createToken() + '-|-' + user.uId,
                initDate: new Date().getTime(),
            };
            await tokenServer.add(tokenInstance);
            reply.send(new PublicReturn(200, '成功', tokenInstance.token));
        },
    );
    fastify.get(
        '/user/info',
        {
            preHandler: apiMiddleware.vToken,
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const headers = request.headers || {};
            const token = String(headers.token) || '';
            const id = token.split('-|-')[1];
            const user = await userServer.find((item: any) => item.uId == id);
            if (!user) {
                reply.code(400).send(new PublicReturn(400, '没找到相应用户'));
                return;
            }
            const tokenList = await tokenServer.filter((item: any) => {
                return item.userUId == user.uId;
            });
            user.tokenNumber = tokenList.length;
            delete user.password;
            reply.send(new PublicReturn(200, '成功', user));
        },
    );
    fastify.put(
        '/user/update',
        {
            preHandler: [apiMiddleware.vToken, getReqLimiter(1, 1000 * 3)],
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const headers = request.headers || {};
            const token = String(headers.token) || '';
            const id = token.split('-|-')[1];
            const mustKeys: any = ['uId', 'nickname', 'synopsis', 'avatar', 'about'];
            const params: any = justPick(request.body || {}, mustKeys);
            const verifiedData = userUpdateValidatorFn(params);
            if (verifiedData) {
                reply.code(400).send(new PublicReturn(400, verifiedData));
                return;
            }
            if (id != params.uId) {
                reply.code(400).send(new PublicReturn(400, '尝试修改其他用户数据'));
                return;
            }
            const user = await userServer.find((item: any) => item.uId == id);
            if (!user) {
                reply.code(404).send(new PublicReturn(404, '没找到相应用户'));
                return;
            }
            params.updateDate = new Date().getTime();
            await userServer.update(user, params);
            reply.send(new PublicReturn(200, '修改成功', params));
        },
    );
    fastify.post(
        '/user/change-password',
        {
            preHandler: [apiMiddleware.vToken, getReqLimiter(1, 1000 * 3)],
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const params: any = justPick(request.body || {}, [
                'secret',
                'oldPassword',
                'newPassword',
            ] as any);
            params.oldPassword = privateDecrypt(params.oldPassword || '');
            params.newPassword = privateDecrypt(params.newPassword || '');
            const verifiedData = userChangePasswordValidatorFn(params);
            if (verifiedData) {
                reply.code(400).send(new PublicReturn(400, verifiedData));
                return;
            }
            const headers: any = request.headers || {};
            const token = String(headers.token) || '';
            const userUId = token.split('-|-')[1];
            await sequelize.transaction(async (t: any) => {
                const user: any = await userServer.findByUId(userUId, { transaction: t });
                if (!user) {
                    reply.code(404).send(new PublicReturn(404, '没找到相应用户'));
                    return;
                }
                if (!userTools.comparePassword(params.secret || '', user.secret || '')) {
                    reply.code(403).send(new PublicReturn(403, '秘钥验证失败'));
                    return;
                }
                if (!userTools.comparePassword(params.oldPassword || '', user.password || '')) {
                    reply.code(400).send(new PublicReturn(400, '原密码验证失败'));
                    return;
                }
                const saltRounds = getRandomElement([6, 7, 8, 9, 10, 11]);
                const newPasswordHash = userTools.hashPassword(params.newPassword || '', saltRounds);
                await userServer.updatePassword(user, newPasswordHash, { transaction: t });
                /** 清除该用户所有 token，强制重新登录 */
                await tokenServer.deleteByUser(userUId, { transaction: t });
                reply.send(new PublicReturn(200, '修改成功，请重新登录'));
            });
        },
    );
    fastify.post(
        '/user/change-secret',
        {
            preHandler: [apiMiddleware.vToken, getReqLimiter(1, 1000 * 3)],
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const params: any = justPick(request.body || {}, ['oldSecret', 'newSecret'] as any);
            const verifiedData = userChangeSecretValidatorFn(params);
            if (verifiedData) {
                reply.code(400).send(new PublicReturn(400, verifiedData));
                return;
            }
            const headers: any = request.headers || {};
            const token = String(headers.token) || '';
            const userUId = token.split('-|-')[1];
            await sequelize.transaction(async (t: any) => {
                const user: any = await userServer.findByUId(userUId, { transaction: t });
                if (!user) {
                    reply.code(404).send(new PublicReturn(404, '没找到相应用户'));
                    return;
                }
                if (!userTools.comparePassword(params.oldSecret || '', user.secret || '')) {
                    reply.code(403).send(new PublicReturn(403, '原秘钥验证失败'));
                    return;
                }
                await userServer.updateSecret(user, userTools.hashPassword(params.newSecret), {
                    transaction: t,
                });
                reply.send(new PublicReturn(200, '修改成功', { secret: params.newSecret }));
            });
        },
    );
    fastify.post(
        '/user/logout',
        {
            preHandler: apiMiddleware.vToken,
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const params: any = request.body || {};
            const headers = request.headers || {};
            const token = String(headers.token) || '';
            const id = token.split('-|-')[1];
            const tokenList: any = await tokenServer.allList();
            const user = await userServer.find((item: any) => item.uId == id);
            if (!user) {
                reply.code(404).send(new PublicReturn(404, '没找到相应用户'));
                return;
            }
            /** 删除token，可以删除该用户的所有token */
            if (params.exitAll === true) {
                await tokenServer.delete_(tokenList);
            } else {
                await tokenServer.delete_(
                    tokenList.filter((item: any) => {
                        return item.userUId == user.uId && item.token == token;
                    }),
                );
            }
            reply.send(new PublicReturn(200, '成功'));
        },
    );
}
