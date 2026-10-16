import StorageS from 'storages-js';

const allStorage: any = {};
function createS(key: string, value?: any) {
    if (!allStorage[key]) {
        allStorage[key] = new StorageS(key, value, { modelName: 'local' });
    }
    return allStorage[key];
}

const userStorage = (value?: any) => {
    return createS('user-container', value);
};
const tagStorage = (value?: any) => {
    return createS('tag-container', value);
};

export default {
    userStorage,
    tagStorage,
};
