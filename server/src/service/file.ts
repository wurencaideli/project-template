import { entityInstance } from '../entity/file.js';

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
export async function findByFileName(fileName: string) {
    const row = await entityInstance.findOne({ where: { fileName } });
    return (row && row.get({ plain: true })) || undefined;
}
export async function findByUId(uId: string) {
    const row = await entityInstance.findByPk(uId);
    return (row && row.get({ plain: true })) || undefined;
}
export async function add(data: any) {
    const row = await entityInstance.create(data);
    return row.get({ plain: true });
}
export async function delete_(instance: any) {
    if (!instance?.uId) return 0;
    await instance.destroy();
    return 1;
}