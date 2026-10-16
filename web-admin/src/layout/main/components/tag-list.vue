<script lang="ts">
import {
    defineComponent,
    ref,
    reactive,
    computed,
    onMounted,
    watch,
    toRef,
    onUnmounted,
    nextTick,
} from 'vue';
import { useRouter } from 'vue-router';
import draggable from 'vuedraggable';

import SvgIcon from '~/components/svg-icon.vue';
import { deepCopyObj, isPc } from '~/common/common-tools.ts';
import {
    deleteTags,
    updateTag,
    refreshTag,
    deleteOtherTags,
    deleteLeftTags,
    deleteRightTags,
    toLatestTag,
} from '~/store/tag-manage.ts';
import { createDropdownMenu } from '~/action/dropdown-menu-modal-service.ts';
import DropdownMenuModal from '~/components/dropdown-menu-modal.vue';
import type { Tag } from '~/types/tag.ts';

export default defineComponent({
    name: 'TagList',
    components: {
        SvgIcon,
        draggable,
    },
    props: {
        activePath: {
            type: [Number, String],
            default: 0,
        },
        layoutGroupSign: {
            type: String,
            default: '',
        },
        tagList: {
            type: Array,
            default: () => {
                return [];
            },
        },
    },
    emits: ['onChange'],
    setup(props, { emit }) {
        const router = useRouter();
        const ElScrollbarRef = ref<any>(null);
        const dataContainer: any = reactive({
            tagList: toRef(props, 'tagList'),
            activePath: toRef(props, 'activePath'),
            layoutGroupSign: toRef(props, 'layoutGroupSign'),
            isPc: isPc(),
            activeItem: null,
        });
        const otherDataContainer: any = {
            menu: null,
            menuTarget: null,
            menu2: null,
            menu2Target: null,
        };
        /** 用来排序转换的数组，由外部确定是否转换 */
        const tagListTrans = computed({
            get() {
                return dataContainer.tagList;
            },
            set(value) {
                emit('onChange', value);
            },
        });
        function handleScroll(e: any) {
            if (!ElScrollbarRef.value) return;
            if (e.shiftKey) return;
            const el = ElScrollbarRef.value;
            let scrollLeft = el.scrollLeft;
            if (e.deltaY < 0) {
                scrollLeft = scrollLeft - 30;
            } else {
                scrollLeft = scrollLeft + 30;
            }
            el.scrollLeft = scrollLeft;
        }
        function autoScroll() {
            setTimeout(() => {
                if (!ElScrollbarRef.value) return;
                const el = ElScrollbarRef.value;
                const target = el.querySelector('.item.active');
                if (!target) return;
                const rect = el.getBoundingClientRect();
                const rect_1 = target.getBoundingClientRect();
                if (rect_1.x < rect.x) {
                    // 表示在左边遮挡
                    const scroll = rect.x - rect_1.x;
                    el.scrollLeft = el.scrollLeft - scroll - 10;
                }
                if (rect_1.x + rect_1.width > rect.x + rect.width) {
                    // 表示在右边遮挡
                    const scroll = rect_1.x - (rect.x + rect.width);
                    el.scrollLeft = el.scrollLeft + scroll + rect_1.width + 10;
                }
            }, 16);
        }
        watch(toRef(props, 'activePath'), () => {
            autoScroll();
        });
        watch(toRef(props, 'tagList'), () => {
            autoScroll();
        });
        let resizeObserver: ResizeObserver | null = null;
        onMounted(() => {
            autoScroll();
            resizeObserver = new ResizeObserver(() => {
                autoScroll();
            });
            const innerEl = ElScrollbarRef.value?.querySelector('.scrollbar-container');
            if (ElScrollbarRef.value) resizeObserver.observe(ElScrollbarRef.value);
            if (innerEl) resizeObserver.observe(innerEl);
            document.addEventListener('pointerdown', handleDocPointerdown, true);
        });
        onUnmounted(() => {
            resizeObserver?.disconnect();
            document.removeEventListener('pointerdown', handleDocPointerdown, true);
            otherDataContainer.menu?.destroy();
            otherDataContainer.menu2?.destroy();
        });
        function closeMenu() {
            const menu = otherDataContainer.menu;
            if (menu) menu.show = false;
            dataContainer.activeItem = null;
        }
        function closeMenu2() {
            const menu = otherDataContainer.menu2;
            if (menu) menu.show = false;
        }
        function handleDocPointerdown(e: any) {
            const el = e.target as HTMLElement;
            if (
                otherDataContainer.menu?.show &&
                !otherDataContainer.menu.dropdownMenuContainerEl.contains(el) &&
                !otherDataContainer.menuTarget?.contains(el)
            ) {
                closeMenu();
            }
            if (
                otherDataContainer.menu2?.show &&
                !otherDataContainer.menu2.dropdownMenuContainerEl.contains(el) &&
                !otherDataContainer.menu2Target?.contains(el)
            ) {
                closeMenu2();
            }
        }
        function getMenuList(item: Tag) {
            return [
                {
                    label: '刷新此标签页',
                    iconName: 'svg:rotate-cw.svg',
                    iconStyle: 'width:16px;min-width:16px;height:16px;color:#0072E5;',
                    onClick: () => {
                        closeMenu();
                        handleOptionClick('handleRefresh', item);
                    },
                },
                {
                    label: '切换缓存状态',
                    iconName: 'svg:toggle-left.svg',
                    iconStyle: 'width:16px;min-width:16px;height:16px;',
                    onClick: () => {
                        closeMenu();
                        handleOptionClick('handleSwitchCache', item);
                    },
                },
                {
                    label: '切换固定状态',
                    iconName: 'svg:pin.svg',
                    iconStyle: 'width:16px;min-width:16px;height:16px;',
                    onClick: () => {
                        closeMenu();
                        handleOptionClick('handleSwitchFixed', item);
                    },
                },
                {
                    label: '在新窗口打开',
                    iconName: 'svg:send.svg',
                    iconStyle: 'width:16px;min-width:16px;height:16px;',
                    onClick: () => {
                        closeMenu();
                        handleOptionClick('handleNewOpen', item);
                    },
                },
                ...(tagListTrans.value.length > 1
                    ? [
                          {
                              label: '关闭其他标签页',
                              iconName: 'svg:separator-vertical.svg',
                              iconStyle: 'width:16px;min-width:16px;height:16px;color:#f86464;',
                              onClick: () => {
                                  closeMenu();
                                  handleOptionClick('handleDeleteOtherTags', item);
                              },
                          },
                      ]
                    : []),
            ];
        }
        /** 鼠标右击，展示自定义右击面板，实例只创建一次，换目标时更新 target 和 props */
        function handleClickContext(item: Tag, e: MouseEvent) {
            const menu = otherDataContainer.menu;
            const target = e.currentTarget as HTMLElement;
            if (menu && menu.show && otherDataContainer.menuTarget == target) {
                closeMenu();
                return;
            }
            dataContainer.activeItem = item;
            otherDataContainer.menuTarget = target;
            const list = getMenuList(item);
            if (menu) {
                menu.target = target;
                menu.setProps({ list });
                menu.show = true;
                return;
            }
            otherDataContainer.menu = createDropdownMenu({
                target,
                show: true,
                displayAreaLimit: 'vertical',
                offset: 5,
                component: DropdownMenuModal,
                props: { list },
            });
        }
        function getMenu2List() {
            return [
                {
                    label: '刷新所有标签页',
                    iconName: 'svg:rotate-cw.svg',
                    iconStyle: 'width:16px;min-width:16px;height:16px;color:#0072E5;',
                    onClick: () => {
                        closeMenu2();
                        handleOptionClick('handleRefreshAll', {
                            routePath: dataContainer.activePath,
                        });
                    },
                },
                ...(tagListTrans.value.length > 1
                    ? [
                          {
                              label: '关闭其他标签页',
                              iconName: 'svg:separator-vertical.svg',
                              iconStyle: 'width:16px;min-width:16px;height:16px;color:#f86464;',
                              onClick: () => {
                                  closeMenu2();
                                  handleOptionClick('handleDeleteOtherTags', {
                                      routePath: dataContainer.activePath,
                                  });
                              },
                          },
                          {
                              label: '关闭左边标签页',
                              iconName: 'svg:arrow-left.svg',
                              iconStyle: 'width:16px;min-width:16px;height:16px;color:#f86464;',
                              onClick: () => {
                                  closeMenu2();
                                  handleOptionClick('handleDeleteLeftTags', {
                                      routePath: dataContainer.activePath,
                                  });
                              },
                          },
                          {
                              label: '关闭右边标签页',
                              iconName: 'svg:arrow-right.svg',
                              iconStyle: 'width:16px;min-width:16px;height:16px;color:#f86464;',
                              onClick: () => {
                                  closeMenu2();
                                  handleOptionClick('handleDeleteRightTags', {
                                      routePath: dataContainer.activePath,
                                  });
                              },
                          },
                      ]
                    : []),
            ];
        }
        /** 点击视图图标弹出标签页批量操作菜单，实例只创建一次，复用时刷新 props */
        function handleShowMenu(e: MouseEvent) {
            const menu = otherDataContainer.menu2;
            if (menu) {
                menu.setProps({ list: getMenu2List() });
                menu.show = !menu.show;
                return;
            }
            otherDataContainer.menu2Target = e.currentTarget;
            otherDataContainer.menu2 = createDropdownMenu({
                target: e.currentTarget as HTMLElement,
                show: true,
                displayAreaLimit: 'vertical',
                offset: 5,
                component: DropdownMenuModal,
                props: { list: getMenu2List() },
            });
        }
        /**
         * tag 点击事件，跳转到该标签的地址里，注意是完整地址
         */
        function handleTagClick(item?: Tag) {
            closeMenu();
            if (!item || !item.routeFullPath) return;
            router.push(item.routeFullPath);
        }
        /** 操作事件 */
        function handleOptionClick(type: any, tagParams?: any) {
            tagParams = deepCopyObj(tagParams || {});
            let tag: Tag | undefined;
            switch (true) {
                /** 删除一个标签 */
                case type == 'handleTagRemove':
                    if (tagListTrans.value.length <= 1) return;
                    deleteTags(tagParams.routePath, dataContainer.layoutGroupSign);
                    toLatestTag(dataContainer.layoutGroupSign);
                    break;
                /** 切换标签状态 */
                case type == 'handleSwitchCache':
                    if (!tagParams.routePath) return;
                    updateTag(
                        Object.assign(tagParams, {
                            isCache: !tagParams.isCache,
                            layoutGroupSign: dataContainer.layoutGroupSign,
                        }),
                    );
                    break;
                /** 切换标签状态 */
                case type == 'handleSwitchFixed':
                    if (!tagParams.routePath) return;
                    updateTag(
                        Object.assign(tagParams, {
                            fixed: !tagParams.fixed,
                            layoutGroupSign: dataContainer.layoutGroupSign,
                        }),
                    );
                    break;
                case type == 'handleRefresh':
                    if (!tagParams.routePath) return;
                    refreshTag({
                        routePath: tagParams.routePath,
                        layoutGroupSign: dataContainer.layoutGroupSign,
                    });
                    break;
                case type == 'handleDeleteOtherTags':
                    deleteOtherTags(
                        Object.assign(tagParams, {
                            layoutGroupSign: dataContainer.layoutGroupSign,
                        }),
                    );
                    break;
                case type == 'handleDeleteLeftTags':
                    deleteLeftTags(
                        Object.assign(tagParams, {
                            layoutGroupSign: dataContainer.layoutGroupSign,
                        }),
                    );
                    break;
                case type == 'handleDeleteRightTags':
                    deleteRightTags(
                        Object.assign(tagParams, {
                            layoutGroupSign: dataContainer.layoutGroupSign,
                        }),
                    );
                    break;
                case type == 'handleRefreshAll':
                    refreshTag({
                        routePath: tagParams.routePath,
                        layoutGroupSign: dataContainer.layoutGroupSign,
                        refreshAll: true,
                    });
                    break;
                case type == 'handleNewOpen':
                    tag = tagParams;
                    if (tag && tag.routeFullPath) {
                        const routeUrl = router.resolve(tag.routeFullPath);
                        window.open(routeUrl.href, '_blank');
                    }
                    break;
            }
        }
        return {
            dataContainer,
            handleOptionClick,
            tagListTrans,
            handleScroll,
            ElScrollbarRef,
            handleClickContext,
            handleTagClick,
            handleShowMenu,
        };
    },
});
</script>

<template>
    <div class="tag-list-cp-container">
        <div class="left" @wheel.passive="handleScroll">
            <div class="scrollbar no-scrollbar" ref="ElScrollbarRef">
                <draggable
                    class="scrollbar-container"
                    item-key="routePath"
                    :disabled="!dataContainer.isPc"
                    v-model="tagListTrans"
                >
                    <template #item="{ element }">
                        <div
                            :class="{
                                item: true,
                                active: element.isActive,
                                'is-select':
                                    dataContainer.activeItem &&
                                    dataContainer.activeItem.routePath == element.routePath,
                            }"
                            @click="handleTagClick(element)"
                            @contextmenu.prevent="handleClickContext(element, $event)"
                        >
                            <SvgIcon
                                class="sign icon-sign"
                                v-if="element.showTagIcon && element.tagIconName"
                                :style="'width: 15px;min-width:15px;height: 15px;'"
                                :name="element.tagIconName"
                            ></SvgIcon>
                            {{ element.title || '未知标签' }}
                            <SvgIcon
                                v-if="element.fixed"
                                :style="'width: 15px;min-width:15px;height: 15px;margin-left:5px;opacity: 0.8;'"
                                :name="'svg:pin.svg'"
                            ></SvgIcon>
                            <div
                                v-if="!element.fixed && tagListTrans.length > 1"
                                @click.stop="handleOptionClick('handleTagRemove', element)"
                                class="bt"
                            >
                                <SvgIcon
                                    :style="'width:15px;height:15px;'"
                                    name="svg:x.svg"
                                ></SvgIcon>
                            </div>
                            <div v-if="element.isCache" class="cache"></div>
                        </div>
                    </template>
                </draggable>
            </div>
        </div>
        <div class="right">
            <div
                class="bt"
                @click="
                    handleOptionClick('handleRefresh', {
                        routePath: dataContainer.activePath,
                    })
                "
            >
                <SvgIcon :style="'width:22px;height:22px;'" name="svg:rotate-cw.svg"></SvgIcon>
            </div>
            <div class="bt" @click="handleShowMenu">
                <SvgIcon :style="'width:22px;height:22px;'" name="svg:layout-grid.svg"></SvgIcon>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.tag-list-cp-container {
    height: 100%;
    width: 100%;
    padding: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    color: var(--text-color);
    --item-gap: 10px;
    padding: 0 var(--item-gap) 0 0;
    > .left {
        flex: 1 1 0;
        width: 0;
        height: 100%;
        margin-right: var(--item-gap);
        :deep(.scrollbar) {
            width: 100%;
            height: 100%;
            overflow-x: auto;
            overflow-y: hidden;
            .scrollbar-container {
                display: flex;
                flex-direction: row;
                justify-content: flex-start;
                align-items: center;
                width: fit-content;
                height: 100%;
                padding: 0 var(--item-gap);
                box-sizing: border-box;
                .item {
                    cursor: pointer;
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    align-items: center;
                    padding: 5px 10px;
                    box-sizing: border-box;
                    margin: 0 5px 0 0;
                    font-size: 12px;
                    font-weight: bold;
                    height: 30px;
                    width: max-content;
                    border-radius: 5px;
                    color: var(--text-color);
                    position: relative;
                    transition: all 0.2s;
                    opacity: 0.8;
                    --bt-width: 20px;
                    --bt-width-1: calc(var(--bt-width) / 2);
                    &:last-child {
                        margin: 0;
                    }
                    &.active {
                        background-color: #5340ff;
                        color: var(--text-color-2);
                        font-weight: bold;
                        opacity: 1;
                        box-shadow: var(--box-shadow-2);
                    }
                    &.is-select {
                        box-shadow: inset 0 0 0 2px #5340ff !important;
                    }
                    &:hover {
                        background-color: #5340ff;
                    }
                    > .sign {
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        background-color: #5240ff;
                        margin-right: 5px;
                        &.icon-sign {
                            background-color: transparent;
                        }
                    }
                    > .bt {
                        width: fit-content;
                        height: fit-content;
                        display: flex;
                        flex-direction: row;
                        justify-content: center;
                        align-items: center;
                        transition: all 0.2s;
                        box-sizing: border-box;
                        margin-left: 5px;
                        &:hover {
                            color: red;
                        }
                    }
                    > .cache {
                        width: 30%;
                        max-width: 30px;
                        min-width: 15px;
                        height: 3px;
                        border-radius: 999px;
                        background-color: rgba(255, 255, 255, 0.397);
                        position: absolute;
                        bottom: -1px;
                        box-shadow: var(--box-shadow-2);
                    }
                }
            }
        }
    }
    > .right {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 0 0px 0 0px;
        box-sizing: border-box;
        height: 100%;
        > * {
            margin: 0 0 0 15px;
            &:first-child {
                margin: 0;
            }
        }
        .bt {
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            color: #c2c2c2;
            &:hover {
                color: #ffffff;
            }
        }
    }
}
</style>
