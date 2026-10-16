import { useRouter } from '~/router/index.ts';
import { tagDataStore } from '~/store/tag.ts';
import { deepCopyObj } from '~/common/common-tools.ts';
import { getNanoid } from '~/common/guid.ts';
import { findPermissionConfigByRoutePath } from '~/store/user-manage.ts';
import type { Tag } from '~/types/tag.ts';

export function setTagList(layoutGroupSign: string, value: Tag[]) {
    const tagData = tagDataStore();
    const tagList = value || [];
    const tagRoutePathMap = tagList.reduce((c: any, i: any) => {
        if (i.routePath) c[i.routePath] = i;
        return c;
    }, {});
    tagData.setTagMap({
        ...tagData.tagMap,
        [layoutGroupSign || '']: {
            tagList,
            tagRoutePathMap,
        },
    });
}

/** 清空所有标签 */
export function clearAllTags() {
    tagDataStore().setTagMap({});
}

function getGroupTagList(layoutGroupSign?: string): Tag[] {
    const tagData = tagDataStore();
    return deepCopyObj(tagData.tagMap[layoutGroupSign || '']?.tagList || []);
}

export function findTag(routePath: string, layoutGroupSign?: string) {
    return getGroupTagList(layoutGroupSign).find((item: Tag) => item.routePath == routePath);
}

function findTagIndex(routePath: string, layoutGroupSign: string) {
    return getGroupTagList(layoutGroupSign).findIndex((item: Tag) => item.routePath == routePath);
}

export function deleteTags(routePaths: string | string[], layoutGroupSign: string) {
    if (!routePaths) return;
    if (!Array.isArray(routePaths)) {
        routePaths = [routePaths];
    }
    const tagList = getGroupTagList(layoutGroupSign).filter((item: Tag) => {
        return !routePaths.includes(item.routePath);
    });
    setTagList(layoutGroupSign, tagList);
}

export function updateTag(tag: any) {
    if (!tag || !tag.routePath) return;
    const layoutGroupSign = tag.layoutGroupSign;
    const tagList = getGroupTagList(layoutGroupSign);
    const target = tagList.find((item: Tag) => item.routePath == tag.routePath);
    if (!target) return;
    Object.assign(target, tag);
    setTagList(layoutGroupSign, tagList);
}

/** 过滤掉不再支持的标签 */
export function filterTags() {
    const tagData = tagDataStore();
    const router = useRouter();
    Object.keys(tagData.tagMap).forEach((layoutGroupSign) => {
        const tagList = getGroupTagList(layoutGroupSign);
        const newTagList: Tag[] = [];
        const pathMap: any = {};
        tagList.forEach((item: any) => {
            const toRoutePath = item.routePath;
            if (pathMap[toRoutePath]) return;
            // 判断是否是系统路由
            if (!router.resolve(toRoutePath).matched.length) return;
            // 判断是否有用户权限
            const userPermissionConfig = findPermissionConfigByRoutePath(toRoutePath);
            if (!userPermissionConfig) return;
            newTagList.push(Object.assign({}, userPermissionConfig, item));
            pathMap[toRoutePath] = true;
        });
        setTagList(layoutGroupSign, newTagList);
    });
}

export function refreshTag({ routePath, refreshAll = false, layoutGroupSign }: any = {}) {
    const router = useRouter();
    const tagList = getGroupTagList(layoutGroupSign);
    let target = tagList.find((item: Tag) => {
        return item.routePath == routePath;
    });
    if (!target) return;
    if (!target.redirectName) {
        router.push(target.routeFullPath);
        return;
    }
    const isCache = target.isCache;
    if (refreshAll) {
        tagList.forEach((item: Tag) => {
            item.isCache = false;
        });
    } else {
        target.isCache = false;
    }
    setTagList(layoutGroupSign, tagList);
    let myAfterEach: any = router.afterEach(() => {
        if (!target) return;
        target.isCache = isCache;
        target = undefined;
        setTagList(layoutGroupSign, tagList);
        myAfterEach();
        myAfterEach = null;
    });
    router.push({
        name: target.redirectName,
        params: {
            sign: getNanoid(),
        },
        query: {
            path: target.routeFullPath,
        },
    });
}

function deleteTagsByFilter(layoutGroupSign: string, filter: (item: Tag, index: number) => boolean) {
    const tagList = getGroupTagList(layoutGroupSign);
    const routePaths = tagList
        .filter((item: Tag, index: number) => {
            return !item.fixed && filter(item, index);
        })
        .map((item: Tag) => item.routePath);
    deleteTags(routePaths, layoutGroupSign);
}

export function deleteOtherTags(tag: any) {
    if (!tag || !tag.routePath) return;
    deleteTagsByFilter(tag.layoutGroupSign, (item) => item.routePath != tag.routePath);
}

export function deleteLeftTags(tag: any) {
    if (!tag || !tag.routePath) return;
    const currentIndex = findTagIndex(tag.routePath, tag.layoutGroupSign);
    deleteTagsByFilter(tag.layoutGroupSign, (_, index) => index < currentIndex);
}

export function deleteRightTags(tag: any) {
    if (!tag || !tag.routePath) return;
    const currentIndex = findTagIndex(tag.routePath, tag.layoutGroupSign);
    deleteTagsByFilter(tag.layoutGroupSign, (_, index) => index > currentIndex);
}

function findMaxSortTag(tagList: Tag[]) {
    return tagList.reduce(
        (max: any, item: Tag) =>
            (Number(item.tagShowNumber) || 0) > (Number(max?.tagShowNumber) || -1) ? item : max,
        undefined,
    );
}

export function getLatestTag(layoutGroupSign: string) {
    return findMaxSortTag(getGroupTagList(layoutGroupSign));
}

/** 当前还有激活的标签就不动，没了则跳到最近使用的标签，一个都没有则跳转首页 */
export function toLatestTag(layoutGroupSign: string) {
    const router = useRouter();
    const tagList = getGroupTagList(layoutGroupSign);
    if (tagList.some((item: Tag) => item.isActive)) return;
    const tag = findMaxSortTag(tagList);
    if (tag && tag.routeFullPath) {
        router.push(tag.routeFullPath);
        return;
    }
    router.push('/main/index');
}

/** 设置指定标签为激活状态 */
export function setActiveTag(routePath: string, layoutGroupSign: string) {
    const tagList = getGroupTagList(layoutGroupSign);
    tagList.forEach((item: Tag) => {
        item.isActive = item.routePath == routePath;
    });
    setTagList(layoutGroupSign, tagList);
}

export function addTag(tag: Tag) {
    if (!tag.hasTag) return;
    const layoutGroupSign = tag.layoutGroupSign || '';
    if (!layoutGroupSign) return;
    const localTagList = getGroupTagList(layoutGroupSign);
    const maxItem = findMaxSortTag(localTagList);
    tag.tagShowNumber = (Number(maxItem?.tagShowNumber) || 0) + 1;
    const target = localTagList.find((item: Tag) => {
        return item.routePath == tag.routePath;
    });
    /** 不存在则添加，存在则更新 */
    if (!target) {
        const insertIndex = maxItem ? localTagList.indexOf(maxItem) + 1 : localTagList.length;
        localTagList.splice(insertIndex, 0, tag);
    } else {
        Object.assign(target, {
            routeFullPath: tag.routeFullPath,
            tagShowNumber: tag.tagShowNumber,
        });
    }
    setTagList(layoutGroupSign, localTagList);
}
