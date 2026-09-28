import { entityInstance } from '../entity/token.js';

/** 用作token的缓存，方便查找 */
const tokenMap: any = new Map();
/** 初始化缓存，从数据库加载所有token */
export async function init() {
    const rows: any = await entityInstance.findAll();
    tokenMap.clear();
    rows.forEach((item: any) => {
        tokenMap.set(item.token, item.get({ plain: true }));
    });
}
export function list(option: any) {
    const page = option.page || 1;
    const size = option.size || 15;
    return entityInstance
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
    return entityInstance
        .findAll()
        .then((rows: any) => rows.map((item: any) => item.get({ plain: true })));
}
export async function filter(fn: any) {
    const list = await allList();
    return list.filter(fn);
}
export async function findByToken(token: string) {
    const row = await entityInstance.findOne({ where: { token } });
    return (row && row.get({ plain: true })) || undefined;
}
export async function find(fn: any) {
    const list = await allList();
    return list.find(fn);
}
export async function findSync(fn: any) {
    const list = await allList();
    return list.find(fn);
}
export async function add(data: any, option: any = {}) {
    const row = await entityInstance.create(data, option);
    if (data?.token) {
        tokenMap.set(data.token, { ...data });
    }
    return row;
}
export async function update(instance: any, data: any) {
    const newToken = data?.token;
    const result = await instance.update(data);
    if (newToken) {
        tokenMap.delete(instance.token);
    }
    const plain = instance.get({ plain: true });
    tokenMap.set(plain.token, plain);
    return result;
}
export async function delete_(instance: any, option: any = {}) {
    const list = Array.isArray(instance) ? instance : [instance];
    for (const item of list) {
        if (item?.token) {
            tokenMap.delete(item.token);
        }
    }
    const tokens = list.map((item: any) => item.token).filter(Boolean);
    if (tokens.length === 0) return list.length;
    await entityInstance.destroy({ where: { token: tokens }, ...option });
    return list.length;
}
export async function deleteByUser(userUId: string, option: any = {}) {
    for (const key of Array.from(tokenMap.keys())) {
        if (tokenMap.get(key)?.userUId === userUId) {
            tokenMap.delete(key);
        }
    }
    await entityInstance.destroy({ where: { userUId }, ...option });
}
/** 同步验证 token，从缓存读取 */
export function verifyToken(token: string) {
    if (!token) {
        return { state: false, msg: '验证失败: 请携带参数 token' };
    }
    const id = token.split('-|-')[1];
    const tokenRow = tokenMap.get(token);
    if (!tokenRow || tokenRow.userUId !== id) {
        return { state: false, msg: '验证失败: 该token无效' };
    }
    return {
        state: true,
        userUId: tokenRow.userUId,
        userName: tokenRow.userName,
        userRole: tokenRow.userRole,
    };
}
