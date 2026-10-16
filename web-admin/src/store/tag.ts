import { defineStore } from 'pinia';

import type { Tag } from '~/types/tag.ts';
import allStorage from '~/action/storage-manage.ts';

export type TagMap = {
    [layoutGroupSign: string]: { tagList: Tag[]; tagRoutePathMap: { [path: string]: Tag } };
};

function saveTagStorage(state: any) {
    const tagStorage = allStorage.tagStorage();
    tagStorage.value = { tagMap: state.tagMap };
}

export const tagDataStore = defineStore('tagDataStore', {
    state: () => {
        const tagStorage = allStorage.tagStorage();
        if (typeof tagStorage.value !== 'object') {
            tagStorage.value = {};
        }
        return {
            tagMap: tagStorage.value.tagMap || ({} as TagMap),
        };
    },
    getters: {},
    actions: {
        setTagMap(value: TagMap) {
            this.tagMap = value || {};
            saveTagStorage(this);
        },
    },
});
