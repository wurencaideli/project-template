/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

/**
 * Vitest 配置。
 *
 * 设计:
 * - 只测纯工具函数(common.utils / date.util / 类似纯函数)。
 * - 不接入 @analogjs/vite-plugin-angular。v1.10 在 Angular 22 + TS 6 下
 *   对包含 `*ɵxxx*` 装饰器的 spec 文件会剥掉测试代码,导致 "No test suite found"。
 *   组件级 spec(需要 TestBed)是下一阶段工作:要么升级到 @analogjs/vitest-angular v2
 *   并配套安装 @angular/platform-browser-dynamic(在 Angular 22 中已并入
 *   platform-browser),要么用 Playwright Component Test 替代。
 * - 用 esbuild 处理 TypeScript,默认 target 已兼容 Angular 22 编译产物的 ES2022。
 */
export default defineConfig({
    esbuild: {
        target: 'es2022',
    },
    test: {
        globals: true,
        setupFiles: ['./setup-vitest.ts'],
        include: ['src/**/*.spec.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            reportsDirectory: './coverage',
            include: ['src/app/**/*.ts'],
            exclude: ['src/app/**/*.spec.ts', 'src/app/**/route*'],
        },
        environment: 'jsdom',
        reporters: ['default'],
    },
});