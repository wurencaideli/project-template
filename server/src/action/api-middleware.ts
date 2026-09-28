import { FastifyReply, FastifyRequest } from 'fastify';

import { isPro } from '../common/other-tools.js';
import { verify } from '../common/captcha.js';
import { verifyToken } from '../service/token.js';
import { PublicReturn } from '../common/public-return.js';

/** 权限验证中间件 */
export async function vToken(req: FastifyRequest, res: FastifyReply) {
    const headers = req.headers || {};
    const token = String(headers.token || '');
    const hasToken = verifyToken(token);
    if (!hasToken.state) {
        res.code(401).send(new PublicReturn(401, hasToken.msg || '凭证无效'));
        return;
    }
    (req as any).userInfo = hasToken;
}
/** 仅 admin 角色可用 */
export async function vAdmin(req: FastifyRequest, res: FastifyReply) {
    const headers = req.headers || {};
    const token = String(headers.token || '');
    const hasToken = verifyToken(token);
    if (!hasToken.state) {
        res.code(401).send(new PublicReturn(401, hasToken.msg || '凭证无效'));
        return;
    }
    if (hasToken.userRole !== 'admin') {
        res.code(403).send(new PublicReturn(403, '权限不足'));
        return;
    }
    (req as any).userInfo = hasToken;
}
/** 验证码验证 */
export async function vCaptcha(req: FastifyRequest, res: FastifyReply) {
    if (!isPro()) {
        return;
    }
    const params: any = req.body || {};
    const captchaId = params.captchaId;
    const captchaText = params.captchaText;
    if (!captchaId || !captchaText) {
        res.code(400).send(new PublicReturn(400, '请携带验证码信息'));
        return;
    }
    const status = verify(captchaId, captchaText);
    if (!status) {
        res.code(400).send(new PublicReturn(400, '验证码验证失败 || 验证码过期'));
    }
}
