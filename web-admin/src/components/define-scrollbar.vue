<script lang="ts">
import {
    defineComponent,
    ref,
    reactive,
    onActivated,
    toRef,
    nextTick,
    onMounted,
    onUnmounted,
} from 'vue';
import { DumoguScrollbar } from 'dumogu-scrollbar';
import { SimpleScrollTo } from 'simple-scroll-to';
import 'dumogu-scrollbar/dist/dumogu-scrollbar.css';

import SvgIcon from '~/components/svg-icon.vue';

export default defineComponent({
    components: {
        SvgIcon,
    },
    props: {
        /** 是否显示回到顶部按钮 */
        showUpBt: {
            type: Boolean,
            default: true,
        },
    },
    emits: ['onScroll'],
    setup(props, { emit }) {
        const DefineScrollbarRef = ref<any>(null);
        const ScrollRef = ref<any>(null);
        const dataContainer: any = reactive({
            showUpBt: toRef(props, 'showUpBt'),
            show: false,
        });
        const otherDataContainer = {
            top: 0,
            left: 0,
            scrollbar: null as DumoguScrollbar | null,
        };
        onMounted(() => {
            const el = ScrollRef.value;
            if (!el || !DefineScrollbarRef.value) return;
            const sb = new DumoguScrollbar({
                keepShow: false,
                stopClickPropagation: true,
            });
            otherDataContainer.scrollbar = sb;
            sb.bind(el);
            sb.mount(DefineScrollbarRef.value);
            const tick = () => {
                if (sb.isDestroyed) return;
                if (!sb.isMounted) return;
                sb.update();
                requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
        /** 重新加载时候赋予旧值 */
        onActivated(() => {
            nextTick(() => {
                const el = ScrollRef.value;
                if (!el) return;
                el.scrollTop = otherDataContainer.top || 0;
                el.scrollLeft = otherDataContainer.left || 0;
            });
        });
        onUnmounted(() => {
            otherDataContainer.scrollbar?.destroy();
        });
        /** 滚动事件 */
        function handleScroll(e: any) {
            if (!e || !e.target) return;
            e = e.target;
            if (e.scrollTop > 40 && e.scrollTop > otherDataContainer.top) {
                dataContainer.show = true;
            } else {
                dataContainer.show = false;
            }
            otherDataContainer.top = e.scrollTop || 0;
            otherDataContainer.left = e.scrollLeft || 0;
            emit('onScroll', e);
        }
        /** 回到顶部事件 */
        function handleUp() {
            const el = ScrollRef.value;
            if (!el) return;
            new SimpleScrollTo({
                target: el,
                start: el.scrollTop,
                end: 0,
                duration: 150,
            });
        }
        /** 滚动到某一位置params {left:0,top:0} */
        function handleTo(params: any) {
            const el = ScrollRef.value;
            if (!el) return;
            if (params.left !== undefined) {
                new SimpleScrollTo({
                    target: el,
                    isX: true,
                    start: el.scrollLeft,
                    end: params.left,
                    duration: 150,
                });
            }
            if (params.top !== undefined) {
                new SimpleScrollTo({
                    target: el,
                    start: el.scrollTop,
                    end: params.top,
                    duration: 150,
                });
            }
        }
        return {
            dataContainer,
            DefineScrollbarRef,
            ScrollRef,
            handleScroll,
            handleUp,
            handleTo,
        };
    },
});
</script>

<template>
    <div ref="DefineScrollbarRef" class="define-scrollbar">
        <div class="scroll no-scrollbar" ref="ScrollRef" @scroll="handleScroll">
            <slot></slot>
        </div>
        <div
            v-if="dataContainer.showUpBt"
            @click="handleUp"
            :class="{
                'scrollbar-up-bt': true,
                show: dataContainer.show,
            }"
        >
            <SvgIcon :style="'width:20px;height:20px;'" name="svg:arrow-up-to-line.svg"></SvgIcon>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.define-scrollbar {
    position: relative;
    width: 100%;
    height: 100%;
    > .scroll {
        width: 100%;
        height: 100%;
        overflow: auto;
    }
    :deep(.dumogu-scrollbar) {
        .dumogu-scrollbar-rail_y {
            width: 8px;
        }
        .dumogu-scrollbar-rail_thumb {
            border-radius: 2px;
            background-color: rgba(255, 255, 255, 0.452);
        }
    }
    > .scrollbar-up-bt {
        position: absolute;
        z-index: 999;
        bottom: 15px;
        right: 15px;
        width: 40px;
        height: 40px;
        background-color: #282828;
        border-radius: 5px;
        display: flex;
        justify-content: center;
        align-items: center;
        line-height: 1;
        opacity: 0;
        pointer-events: none;
        transition: all 0.2s;
        cursor: pointer;
        color: rgb(25, 137, 250);
        box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.667);
        &.show {
            opacity: 1;
            pointer-events: initial;
        }
        &:hover {
            transform: scale(1.1);
        }
    }
}
</style>
