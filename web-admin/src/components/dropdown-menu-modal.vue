<script lang="ts">
import { defineComponent } from 'vue';

import SvgIcon from '~/components/svg-icon.vue';

export interface DropdownMenuItem {
    label: string;
    iconName?: string;
    iconStyle?: string;
    logout?: boolean;
    disabled?: boolean;
    onClick?: () => void;
}

export default defineComponent({
    name: 'DropdownMenuModal',
    components: {
        SvgIcon,
    },
    props: {
        list: {
            type: Array,
            default: () => [],
        },
    },
    setup() {
        function handleItemClick(item: DropdownMenuItem) {
            if (item.disabled) return;
            item.onClick?.();
        }
        return {
            handleItemClick,
        };
    },
});
</script>

<template>
    <div class="dropdown-menu-panel">
        <div
            v-for="(item, index) in list as DropdownMenuItem[]"
            :key="index"
            class="dropdown-menu-item"
            :class="{ disabled: item.disabled }"
            @click="handleItemClick(item)"
        >
            <SvgIcon
                v-if="item.iconName"
                :style="item.iconStyle || 'width: 17px;min-width:17px;height: 17px;'"
                :name="item.iconName"
            ></SvgIcon>
            {{ item.label }}
        </div>
    </div>
</template>

<style scoped lang="scss">
.dropdown-menu-panel {
    min-width: 150px;
    width: max-content;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    > .dropdown-menu-item {
        min-width: 150px;
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        padding: 15px 22px;
        box-sizing: border-box;
        font-size: 13px;
        font-weight: 700;
        line-height: 1;
        cursor: pointer;
        transition: all 0.2s;
        color: #cecece;
        border-bottom: 1px solid rgba(255, 255, 255, 0.11);
        > * {
            margin-right: 15px;
        }
        &:hover {
            background-color: rgba(145, 145, 162, 0.17);
            color: #007fff;
        }
        &:last-child {
            border-bottom: none;
        }
        &.disabled {
            opacity: 0.4;
            cursor: not-allowed;
            &:hover {
                background-color: transparent;
                color: #cecece;
            }
        }
    }
}
</style>
