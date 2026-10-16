<script lang="ts">
import { defineComponent } from 'vue';
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';

export default defineComponent({
    components: {
        ElConfigProvider,
    },
    setup() {
        return {
            locale: zhCn,
        };
    },
});
</script>

<template>
    <el-config-provider :locale="locale">
        <router-view v-slot="{ Component }">
            <transition name="el-fade-in">
                <component :is="Component" />
            </transition>
        </router-view>
    </el-config-provider>
</template>
