import { entityInstance as userEntityInstance } from '../entity/user.js';

import { getRandomElement } from '../common/other-tools.js';
import { createUuid } from '../common/uuid-tools.js';
import { hashPassword } from '../common/user-tools.js';

export function list(option: any) {
    const page = option.page || 1;
    const size = option.size || 15;
    return userEntityInstance
        .findAndCountAll({
            offset: (page - 1) * size,
            limit: size,
        })
        .then((res: any) => ({
            list: res.rows.map((item: any) => item.get({ plain: true })),
            total: res.count,
            page,
            size,
        }));
}
export function allList() {
    return userEntityInstance
        .findAll()
        .then((rows: any) => rows.map((item: any) => item.get({ plain: true })));
}
export async function filter(fn: any) {
    const list = await allList();
    return list.filter(fn);
}
export async function getCurrUserSync() {
    const list = await allList();
    return list[0] || null;
}
export async function update(instance: any, user: any) {
    return instance.update(user);
}
export async function delete_(instance: any) {
    if (!instance?.uId) return 0;
    await instance.destroy();
    return 1;
}
export async function findByName(name: string) {
    const row = await userEntityInstance.findOne({ where: { name } });
    return (row && row.get({ plain: true })) || undefined;
}
export async function findByUId(uId: string, option: any = {}) {
    const row = await userEntityInstance.findOne({ where: { uId }, ...option });
    return (row && row.get({ plain: true })) || undefined;
}
export async function add(data: any, option: any = {}) {
    const row = await userEntityInstance.create(data, option);
    return row.get({ plain: true });
}
export async function updatePassword(user: any, newHash: string, option: any = {}) {
    return userEntityInstance.update(
        { password: newHash, updateDate: new Date().getTime() },
        { where: { uId: user.uId }, ...option },
    );
}
export async function updateSecret(user: any, newSecret: string, option: any = {}) {
    return userEntityInstance.update(
        { secret: newSecret, updateDate: new Date().getTime() },
        { where: { uId: user.uId }, ...option },
    );
}
export async function find(fn: any) {
    const list = await allList();
    return list.find(fn);
}
export async function findSync(fn: any) {
    const list = await allList();
    return list.find(fn);
}
export async function createBaseUserData() {
    const count = await userEntityInstance.count();
    if (count > 0) {
        throw '已有用户个数: ' + count;
    }
    const saltRounds = getRandomElement([6, 7, 8, 9, 10, 11]);
    const adminUser: any = {
        uId: createUuid(),
        initDate: new Date().getTime(),
        updateDate: new Date().getTime(),
        name: 'admin',
        role: 'admin',
        nickname: '23朵毒蘑菇',
        synopsis: '欢迎使用 Dumogu Blog',
        about: '23朵毒蘑菇的 BLOG',
        password: hashPassword('1234567890', saltRounds),
        avatar: 'assets/public/user.jpg',
        secret: hashPassword('1234567890', saltRounds),
    };
    await userEntityInstance.create(adminUser);
    return adminUser;
}
