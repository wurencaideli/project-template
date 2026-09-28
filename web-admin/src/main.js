import { createApp } from 'vue';
import { createPinia } from 'pinia';
import 'element-plus/theme-chalk/dark/css-vars.css';

import { isProd } from '@/common/other-tools.js';
import '@/style/index.scss';
import App from './App.vue';
import router from './router/index.js';
import './permission.js';
import { sysMeluConfigList } from './router/common.js';

const pinia = createPinia();
if (!isProd()) {
    console.log('系统完整路由表，router挂载全局window.router', router, sysMeluConfigList);
    /** 挂载到全局方便操作 */
    window.router = router;
    /** 提示重复菜单 */
    sysMeluConfigList.reduce((c, i) => {
        if (!i.name) return c;
        if (c[i.name]) {
            console.log('重复菜单 name', i);
        }
        c[i.name] = true;
        return c;
    }, {});
}
const app = createApp(App);
app.use(router);
app.use(pinia);
app.mount('#app');
