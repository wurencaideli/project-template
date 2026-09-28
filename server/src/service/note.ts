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
export function allList() {
    return entityInstance.findAll().then((rows: any) => rows.map((item: any) => item.get({ plain: true })));
}
export async function findById(id: string) {
    const row = await entityInstance.findByPk(id);
    return (row && row.get({ plain: true })) || undefined;
}
export async function find(fn: any) {
    const list = await allList();
    return list.find(fn);
}
export async function filter(fn: any) {
    const list = await allList();
    return list.filter(fn);
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
