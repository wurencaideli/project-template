import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import path from 'path';
import fs from 'node:fs';
import util from 'node:util';
import { pipeline } from 'node:stream';

import { vToken } from '../action/api-middleware.js';
import { isValidMimeType, remove } from '../common/file-tools.js';
import * as fileServer from '../service/file.js';
import { PublicReturn } from '../common/public-return.js';
import { createUuid } from '../common/uuid-tools.js';
import { getGlobalVariables } from '../action/setup-global-variables.js';

const pump = util.promisify(pipeline);
export function createRouter(fastify: FastifyInstance) {
    const PROJECT_BASE_HREF = process.env.PROJECT_BASE_HREF;
    const uploadFilesDirPath = getGlobalVariables('uploadFilesDirPath');
    fastify.get(
        '/file/list',
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
            if (
                Object.prototype.hasOwnProperty.call(params, 'fileName') &&
                params.fileName !== ''
            ) {
                searchBy['fileName'] = params.fileName;
            }
            if (
                Object.prototype.hasOwnProperty.call(params, 'mimeType') &&
                params.mimeType !== ''
            ) {
                searchBy['mimeType'] = params.mimeType;
            }
            if (
                Object.prototype.hasOwnProperty.call(params, 'originalName') &&
                params.originalName !== ''
            ) {
                searchBy['originalName'] = params.originalName;
            }
            if (Object.prototype.hasOwnProperty.call(params, 'path') && params.path !== '') {
                searchBy['path'] = params.path;
            }
            const data = await fileServer.list({
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
    fastify.post(
        '/file/upload',
        {
            preHandler: vToken,
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const data: any = await request.file();
            if (!data || !data.filename) {
                reply.code(400);
                return new PublicReturn(400, '没有需要上传的文件');
            }
            const MAX_SIZE = 1024 * 1024 * 1.5;
            if (data.file.bytesRead > MAX_SIZE) {
                reply.code(400);
                return new PublicReturn(400, '文件大小超出限制，最大允许 1.5MB');
            }
            const { file, filename, mimetype } = data;
            const fileMimeTypeList = [
                'image/*',
                'audio/*',
                'video/*',
                'font/*',
                'application/zip',
                'text/*',
            ];
            if (
                fileMimeTypeList.every((item) => {
                    return !isValidMimeType(mimetype, item);
                })
            ) {
                return reply
                    .code(400)
                    .send(
                        new PublicReturn(
                            400,
                            `不支持的文件格式: ${mimetype} 可上传的类型(${fileMimeTypeList.join(',')})`,
                        ),
                    );
            }
            const userInfo: any = (request as any).userInfo || {};
            const uuid = createUuid();
            const now = Date.now();
            const ext = path.extname(filename);
            const saveName = `${uuid}-${now}${ext}`;
            const savePath = path.join(uploadFilesDirPath, saveName);
            const ws = fs.createWriteStream(savePath);
            await pump(file, ws);
            const size = fs.statSync(savePath).size;
            const initDate = Date.now();
            const fileObj = {
                uId: createUuid(),
                userUId: userInfo.userUId,
                fileName: saveName,
                originalName: Buffer.from(filename, 'latin1').toString('utf8'),
                size,
                path: `${PROJECT_BASE_HREF}api/file/info/${saveName}`,
                mimeType: mimetype,
                initDate,
                updateDate: initDate,
            };
            await fileServer.add(fileObj);
            reply.send(new PublicReturn(200, '文件上传成功', fileObj));
        },
    );
    fastify.delete(
        '/file/:fileName',
        {
            preHandler: vToken,
        },
        async function (request: FastifyRequest, reply: FastifyReply) {
            const params: any = request.params || {};
            const fileName = path.basename(params.fileName);
            if (!fileName) {
                reply.code(400).send(new PublicReturn(400, 'fileName: 参数不能为空'));
                return;
            }
            const target = await fileServer.findByFileName(fileName);
            if (!target) {
                reply.code(404).send(new PublicReturn(404, `没有该文件: ${fileName}`));
                return;
            }
            const userInfo: any = (request as any).userInfo || {};
            if (userInfo.userRole !== 'admin' && target.userUId !== userInfo.userUId) {
                reply.code(403).send(new PublicReturn(403, '无权删除该文件'));
                return;
            }
            await remove(path.join(getGlobalVariables('uploadFilesDirPath'), fileName)).catch(
                () => {
                    return;
                },
            );
            await fileServer.delete_(target).catch(() => {});
            reply.send(new PublicReturn(200, `文件已经删除: ${fileName}`));
        },
    );
}
