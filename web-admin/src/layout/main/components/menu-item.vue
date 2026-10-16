<script lang="ts">
import { reactive, toRef, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import SvgIcon from '~/components/svg-icon.vue';
import { findPermissionConfigByRoutePath } from '~/store/user-manage.ts';
import linkItem from './link-item.vue';

export default {
    name: 'MenuItem',
    components: {
        SvgIcon,
        linkItem,
    },
    props: {
        /** 所显示的数据列表 */
        dataInfo: {
            type: Object,
            default: () => {
                return {};
            },
        },
    },
    setup(props) {
        const router = useRouter();
        const route = useRoute();
        const dataContainer: any = reactive({
            dataInfo: toRef(props, 'dataInfo'),
        });
        /** 跳转相应链接 */
        function handleClick(params: any) {
            if (!params.routePath) return;
            /** 如果是一个链接的话直接跳转 */
            if (params.isLink) {
                window.open(params.routePath);
            } else {
                router.push(params.routePath);
            }
        }
        /** routePath相等或路由匹配规则命中都算激活 */
        const isActive = computed(() => {
            const info = dataContainer.dataInfo;
            return (
                info.routePath == route.path ||
                findPermissionConfigByRoutePath(route.path)?.uId == info.uId
            );
        });
        return {
            dataContainer,
            handleClick,
            isActive,
            route,
        };
    },
};
</script>

<template>
    <div class="menu-item-container">
        <!-- 没有子目录的 -->
        <el-menu-item
            v-if="!dataContainer.dataInfo.children || dataContainer.dataInfo.children.length == 0"
            :index="dataContainer.dataInfo.routePath"
            :class="{
                'is-active': isActive,
            }"
            @click="handleClick(dataContainer.dataInfo)"
        >
            <linkItem :dataInfo="dataContainer.dataInfo"></linkItem>
        </el-menu-item>
        <!-- 有子目录且父节点不可点击 -->
        <el-sub-menu v-else :index="dataContainer.dataInfo.title">
            <template #title>
                <linkItem :dataInfo="dataContainer.dataInfo"></linkItem>
            </template>
            <MenuItem
                v-for="(item, index) in dataContainer.dataInfo.children"
                :key="item.uId"
                :dataInfo="item"
            ></MenuItem>
        </el-sub-menu>
    </div>
</template>

<style scoped lang="scss">
.menu-item-container {
    height: fit-content;
    width: 100%;
}
</style>
