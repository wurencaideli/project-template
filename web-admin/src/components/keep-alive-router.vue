<script lang="ts">
import { defineComponent, h, toRef, onUnmounted, PropType } from 'vue';

export default defineComponent({
    name: 'KeepAliveRouter',
    props: {
        cacheList: {
            type: Array as PropType<string[]>,
            default: () => {
                return [];
            },
        },
    },
    setup(props) {
        const cacheList = toRef(props, 'cacheList');
        const wrapperMap = new Map();
        function formatComponentInstance(component: any, route: any) {
            let wrapper;
            if (!component) return;
            const wrapperName = route.path;
            if (wrapperMap.has(wrapperName)) {
                wrapper = wrapperMap.get(wrapperName);
            } else {
                wrapper = {
                    name: wrapperName,
                    render() {
                        return h(component);
                    },
                };
                wrapperMap.set(wrapperName, wrapper);
            }
            /** 以标签页为主，清除不需要的，减少内存 */
            const pathList = cacheList.value || [];
            wrapperMap.forEach((_, key) => {
                if (pathList.includes(key)) return;
                if (key == wrapperName) return;
                wrapperMap.delete(key);
            });
            return h(wrapper);
        }
        /** 组件销毁时清空 wrapper 缓存 */
        onUnmounted(() => {
            wrapperMap.clear();
        });
        return {
            formatComponentInstance,
            cacheList,
        };
    },
});
</script>

<template>
    <router-view v-slot="{ Component, route }">
        <keep-alive :include="cacheList">
            <component :is="formatComponentInstance(Component, route)" />
        </keep-alive>
    </router-view>
</template>
