import { createApp } from 'vue';
import { createPinia } from 'pinia';
import 'element-plus/theme-chalk/dark/css-vars.css';

import '~/style/index.scss';
import App from './App.vue';
import { useRouter } from './router/index.ts';
import { initPermission } from './action/permission.ts';
import { setupDropdownMenuModalService } from './action/dropdown-menu-modal-service.ts';

function init() {
    const router = useRouter();
    const pinia = createPinia();
    const app = createApp(App);
    setupDropdownMenuModalService(app);
    app.use(router);
    app.use(pinia);
    /** 挂载路由守卫 */
    initPermission(router);
    app.mount('#app');
}
init();
