<script lang="ts">
import { defineComponent, reactive, onUnmounted, toRef } from 'vue';
import { useRoute } from 'vue-router';
import { Loading } from '@element-plus/icons-vue';

import { getNanoid } from '~/common/guid.ts';
import { deepCopyObj } from '~/common/common-tools.ts';
import { userDataStore } from '~/store/user.ts';
import { findTag } from '~/store/tag-manage.ts';
import { findPermissionConfigByRoutePath } from '~/store/user-manage.ts';

export default defineComponent({
    components: {
        Loading,
    },
    setup() {
        const userData = userDataStore();
        const route = useRoute();
        const dataContainer: any = reactive({
            iframe: {},
            iframeList: toRef(userData, 'iframeList'),
        });
        /**
         * 数据初始化
         */
        function initData() {
            const params = route.params;
            if (!params.sign) return;
            const config = findPermissionConfigByRoutePath(route.path);
            const tag = findTag(route.path, config?.layoutGroupSign) || ({} as any);
            const iframeList = deepCopyObj(dataContainer.iframeList);
            dataContainer.iframe = {
                path: route.path,
                src: (route.query.src as string) || config?.routeParams || '',
                key: getNanoid(),
                layoutGroupSign: tag.layoutGroupSign,
            };
            iframeList.push(dataContainer.iframe);
            userData.setIframeList(iframeList);
        }
        initData();
        /** 组件销毁时删除该iframe */
        onUnmounted(() => {
            const iframeList = deepCopyObj(userData.iframeList);
            const index = iframeList.findIndex((item: any) => {
                return item.key == dataContainer.iframe.key;
            });
            if (index == -1) return;
            iframeList.splice(index, 1);
            userData.setIframeList(iframeList);
        });
        return {
            dataContainer,
        };
    },
});
</script>

<template>
    <div class="iframe-view">
        <div class="title">Loading ......</div>
    </div>
</template>

<style lang="scss" scoped>
.iframe-view {
    width: 100%;
    height: 100%;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    > .title {
        font-size: 17px;
        margin-top: 40px;
        opacity: 0.7;
    }
}
</style>
