const allPlug: any = {};

export default {
    /** 插件安装 */
    install(name: string, instance: any) {
        allPlug[name] = instance;
    },
    /** 卸载 */
    unInstall(name: string) {
        delete allPlug[name];
    },
    get(name: string) {
        return allPlug[name];
    },
};
