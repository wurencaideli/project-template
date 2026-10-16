/**
 * 将目录转换为树形结构
 */
export function toTree(
    list: any[] = [],
    option: any = { key: 'id', pKey: 'pid', isNew: true, childrenKey: 'children' },
) {
    const { key, pKey, isNew, childrenKey } = option;
    if (isNew) {
        list = JSON.parse(JSON.stringify(list));
    }
    const idMap: any = {};
    const tree: any[] = [];
    list.forEach((item) => {
        idMap[item[key]] = item;
    });
    list.forEach((item) => {
        if (idMap[item[pKey]]) {
            idMap[item[pKey]][childrenKey] = idMap[item[pKey]][childrenKey] || [];
            idMap[item[pKey]][childrenKey].push(item);
        } else {
            tree.push(item);
        }
    });
    return tree;
}
/**
 * 展开树形list结构为一维list
 * @param treeList:array
 * @param option:object
 */
export function unfoldTreeList(treeList: any[], option: any = {}) {
    const {
        childrenKey = 'children', //需要获取子元素的 key
        setParentKey = 'parentId', //需要赋值的父元素 key
        getParentKey = 'id', //获取父元素 key
        forEachFn = null, //循环时的回调
    } = option;
    const deptOneList: any[] = [];
    const deepForEach = (target: any) => {
        deptOneList.push(target);
        forEachFn && forEachFn(target);
        if (target[childrenKey]) {
            target[childrenKey].forEach((item_: any) => {
                item_[setParentKey] = target[getParentKey];
                deepForEach(item_);
            });
        }
    };
    treeList.forEach((item) => {
        deepForEach(item);
    });
    return deptOneList;
}
