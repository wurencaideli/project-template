<script lang="ts">
import { defineComponent, reactive, toRef, ref, watch } from 'vue';

import { getIconUrl, getSvgContent } from '~/action/icon-tools.ts';

export default defineComponent({
    name: 'SvgIcon',
    props: {
        name: {
            type: String,
            default: '',
        },
        style: {
            type: String,
            default: '',
        },
    },
    setup(props) {
        const dataContainer: any = reactive({
            name: toRef(props, 'name'),
            style: toRef(props, 'style'),
        });
        const svgContent = ref('');
        const imgUrl = ref('');
        /** 加载 icon，svg 请求内容，img 直接使用地址 */
        async function loadIcon(name: string) {
            if (!name || !name.startsWith('svg:')) {
                svgContent.value = '';
                imgUrl.value = name && name.startsWith('img:') ? getIconUrl(name) : '';
                return;
            }
            imgUrl.value = '';
            const svg = await getSvgContent(name);
            /** 名称已变更时不写回，避免竞态 */
            if (dataContainer.name === name) {
                svgContent.value = svg;
            }
        }
        watch(
            () => dataContainer.name,
            (name) => {
                loadIcon(name || '');
            },
            { immediate: true },
        );
        return {
            dataContainer,
            svgContent,
            imgUrl,
        };
    },
});
</script>

<template>
    <div class="svg-icon" v-show="svgContent || imgUrl" :style="dataContainer.style">
        <div class="icon-container-svg" v-if="svgContent" v-html="svgContent"></div>
        <img class="icon-container-img" v-if="imgUrl" :src="imgUrl" :alt="dataContainer.name" />
    </div>
</template>

<style lang="scss" scoped>
.svg-icon {
    width: 20px;
    height: 20px;
    line-height: 1;
    > .icon-container-svg {
        width: 100%;
        height: 100%;
        :deep(svg) {
            height: 100%;
            width: 100%;
        }
    }
    > .icon-container-img {
        display: block;
        height: 100%;
        width: 100%;
        object-fit: cover;
    }
}
</style>
