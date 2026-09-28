/**
 * Vitest 全局设置。
 *
 * 原则:
 * - jsdom 是 Angular 在浏览器中需要的 DOM 实现,Vitest 默认不在浏览器环境跑。
 * - 不在这里初始化 Angular TestBed——让需要它的 spec 自己引入。
 * - 不依赖 zone.js 或 @angular/platform-browser-dynamic(避免与 Angular 22 + 单元测试的
 *   TypeScript 6 严格类型冲突,且 `getTestBed().initTestEnvironment` 需要完整 Angular
 *   运行时,仅靠本地 mock 反而会引入隐患)。
 */

// jsdom 默认不包含 matchMedia,避免 echarts / Material 报错
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false,
    }),
});