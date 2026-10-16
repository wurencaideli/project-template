<template>
    <div></div>
</template>

<script lang="ts">
import { useRoute, useRouter } from 'vue-router';

export default {
    name: 'Redirect',
    setup() {
        const route = useRoute();
        const router = useRouter();
        router.replace(route.query.path as any);
        return {};
    },
};
</script>
