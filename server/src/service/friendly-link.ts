import { Op } from 'sequelize';

import { entityInstance } from '../entity/friendly-link.js';

export function list(option: any) {
    const page = option.page || 1;
    const size = option.size || 15;
    const { sortBy, searchBy } = option;
    return entityInstance
        .findAndCountAll({
            where: { ...(searchBy || {}) },
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
export async function findByName(name: string) {
    const row = await entityInstance.findOne({ where: { name } });
    return (row && row.get({ plain: true })) || undefined;
}
export async function findByUIds(uIds: string[]) {
    if (!Array.isArray(uIds) || uIds.length === 0) return [];
    /** 返回 sequelize 实例，配合 delete_() 使用；不要转 plain 对象 */
    return entityInstance.findAll({ where: { uId: { [Op.in]: uIds } } });
}
export async function add(data: any) {
    return entityInstance.create(data);
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