/**
 * https://vitejs.dev/config/
 * https://cn.vitejs.dev/config/#server-proxy
 */
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const pathResolve = (dir: string) => {
    return resolve(__dirname, '.', dir);
};
export default defineConfig(({ mode }) => {
    const isProd = mode !== 'development';
    const env = loadEnv(mode, process.cwd(), '');
    const base = env.VITE_APP_buildBase;
    const outDir = 'dist';
    const plugins = [
        vue(),
        AutoImport({
            resolvers: [ElementPlusResolver()],
            dts: true,
        }),
        Components({
            resolvers: [ElementPlusResolver()],
            dts: true,
        }),
    ];
    return {
        base: base,
        plugins: plugins,
        build: {
            outDir: outDir,
            reportCompressedSize: false,
            sourcemap: isProd ? false : true,
        },
        resolve: {
            alias: {
                '~': pathResolve('./src'),
            },
        },
        server: {
            port: 8087,
            host: true,
            open: true,
            proxy: {
                '/api': {
                    target: 'http://127.0.0.1:8888',
                    // target: 'https://codess.dumogu.top',
                    changeOrigin: true,
                    rewrite: (p) => p.replace(/^\/api/, '/api'),
                },
            },
        },
    };
});
