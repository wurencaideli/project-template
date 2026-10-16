import { defineStore } from 'pinia';

import allStorage from '~/action/storage-manage.ts';
import type { PermissionItem } from '~/types/permission.ts';

function saveUserStorage(state: any) {
    const userStorage = allStorage.userStorage();
    userStorage.value = {
        token: state.token,
    };
}

export const userDataStore = defineStore('userDataStore', {
    state: () => {
        const userStorage = allStorage.userStorage();
        let userData = userStorage.value;
        if (typeof userData !== 'object') {
            userData = {};
            userStorage.value = {};
        }
        return {
            token: userData.token || '',
            info: {},
            permissionList: [] as PermissionItem[],
            menuTree: [] as PermissionItem[],
            permissionBtCodeMap: {} as Record<string, PermissionItem>,
            iframeList: [],
        };
    },
    getters: {},
    actions: {
        setToken(value: any) {
            this.token = value || '';
            saveUserStorage(this);
        },
        setUserInfo(value: any) {
            this.info = value || {};
        },
        setPermissionData(value: any) {
            this.permissionList = value.permissionList || [];
            this.menuTree = value.menuTree || [];
            this.permissionBtCodeMap = value.permissionBtCodeMap || {};
        },
        setIframeList(value: any) {
            this.iframeList = value || [];
        },
    },
});
