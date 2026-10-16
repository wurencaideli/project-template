<script lang="ts">
import { defineComponent, reactive, toRef } from 'vue';

export default defineComponent({
    name: 'UserAvatar',
    components: {},
    props: {
        src: {
            type: String,
            default: '',
        },
        name: {
            type: String,
            default: '',
        },
    },
    setup(props) {
        const dataContainer: any = reactive({
            src: toRef(props, 'src'),
            name: toRef(props, 'name'),
        });
        return {
            dataContainer,
        };
    },
});
</script>

<template>
    <el-image class="user-avatar" :src="dataContainer.src" fit="cover">
        <template #error>
            <div class="name">
                {{ (dataContainer.name || '').slice(0, 1) }}
            </div>
        </template>
    </el-image>
</template>

<style scoped lang="scss">
.user-avatar {
    height: 100%;
    width: 100%;
    background-color: transparent;
    border-radius: 50%;
    overflow: hidden;
    .name {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #dde1e4;
        font-size: var(--user-name-size, 20px);
        font-weight: bold;
    }
}
</style>
