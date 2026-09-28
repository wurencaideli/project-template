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
        '/user',
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
            const user = await userServer.findByName(params.name);
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
            const userInfo: any = (request as any).userInfo || {};
            const userUId = userInfo.userUId;
            const user = await userServer.findByUId(userUId);
            if (!user) {
                reply.code(400).send(new PublicReturn(400, '没找到相应用户'));
                return;
            }
            const safeUser = userServer.pickSafeUser(user);
            safeUser.tokenNumber = tokenServer.countByUser(user.uId);
            reply.send(new PublicReturn(200, '成功', safeUser));
        },
    );
    fastify.put(
        '/user/update',
        {
            preHandler: [apiMiddleware.vToken, getReqLimiter(1, 1000 * 3)],
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const userInfo: any = (request as any).userInfo || {};
            const userUId = userInfo.userUId;
            const mustKeys: any = ['nickname', 'synopsis', 'avatar', 'about'];
            const params: any = justPick(request.body || {}, mustKeys);
            const verifiedData = userUpdateValidatorFn(params);
            if (verifiedData) {
                reply.code(400).send(new PublicReturn(400, verifiedData));
                return;
            }
            const user = await userServer.findByUId(userUId);
            if (!user) {
                reply.code(404).send(new PublicReturn(404, '没找到相应用户'));
                return;
            }
            params.uId = userUId;
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
            const userInfo: any = (request as any).userInfo || {};
            const userUId = userInfo.userUId;
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
            const userInfo: any = (request as any).userInfo || {};
            const userUId = userInfo.userUId;
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
            const userInfo: any = (request as any).userInfo || {};
            const userUId = userInfo.userUId;
            if (params.exitAll === true) {
                /** 退出该用户所有设备 */
                await tokenServer.deleteByUser(userUId);
            } else {
                /** 退出当前设备 */
                if (token) {
                    await tokenServer.deleteByToken(token);
                }
            }
            reply.send(new PublicReturn(200, '成功'));
        },
    );
    fastify.get(
        '/user/public-info/:uId',
        async function (request: FastifyRequest, reply: FastifyReply) {
            const params: any = request.params || {};
            const uId = String(params.uId || '');
            if (!uId) {
                reply.code(400).send(new PublicReturn(400, '参数不能为空: uId'));
                return;
            }
            const user = await userServer.findByUId(uId);
            if (!user) {
                reply.code(404).send(new PublicReturn(404, '没找到相应用户'));
                return;
            }
            reply.send(new PublicReturn(200, '成功', userServer.pickPublicUser(user)));
        },
    );
}
