import { Op } from 'sequelize';

import { entityInstance } from '../entity/note.js';

export function list(option: any) {
    const page = option.page || 1;
    const size = option.size || 15;
    const { sortBy, searchBy, where } = option;
    return entityInstance
        .findAndCountAll({
            where: { ...(searchBy || {}), ...(where || {}) },
            offset: (page - 1) * size,
            limit: size,
            order: sortBy || [['initDate', 'DESC']],
        })
        .then((res: any) => ({
            list: res.rows.map((item: any) => item.get({ plain: true })),
            total: res.count,
            page,
            size,
        }));
}
export async function findByUId(uId: string) {
    const row = await entityInstance.findByPk(uId);
    return (row && row.get({ plain: true })) || undefined;
}
/**
 * 批量按 uId 查询，用于批量删除。
 * @param uIds 待查的 uId 列表
 * @param isAdmin 是否管理员；非管理员只返回自己的数据
 * @param userUId 当前操作用户的 uId（非 admin 时使用）
 * @returns sequelize 实例数组，配合 delete_() 使用
 */
export async function findByUIdsForDelete(uIds: string[], isAdmin: boolean, userUId: string) {
    if (!Array.isArray(uIds) || uIds.length === 0) return [];
    const where: any = { uId: { [Op.in]: uIds } };
    if (!isAdmin) {
        where.userUId = userUId;
    }
    return entityInstance.findAll({ where });
}
export async function add(data: any) {
    const row = await entityInstance.create(data);
    return row.get({ plain: true });
}
export async function update(instance: any, data: any) {
    return instance.update(data);
}
export async function delete_(instance: any) {
    if (Array.isArray(instance)) {
        for (const item of instance) {
            await item.destroy();
        }
        return instance.length;
    }
    await instance.destroy();
    return 1;
}