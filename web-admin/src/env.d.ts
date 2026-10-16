/// <reference types="vite/client" />

/** 环境变量声明 */
interface ImportMetaEnv {
    readonly VITE_APP_name: string;
    readonly VITE_VERSION: string;
    readonly VITE_APP_baseApiURL: string;
    readonly VITE_APP_routeBasePath: string;
    readonly VITE_APP_buildBase: string;
    readonly VITE_APP_content: string;
}

/** 全局window挂载声明 */
interface Window {
    router?: any;
}
