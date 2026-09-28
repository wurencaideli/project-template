import path from 'path';

import { getGlobalVariables, setGlobalVariables } from './setup-global-variables.js';
import { isPro } from '../common/other-tools.js';

/** 注入关键路径到全局变量 */
export function injectionResourcesPath() {
    const serverRootDirPath = getGlobalVariables('serverRootDirPath');
    const serverDataRootDirPath = path.join(serverRootDirPath, '../data', isPro() ? 'pro' : 'dev');
    setGlobalVariables('serverDataRootDirPath', serverDataRootDirPath);
    // RSS / sitemap / 前端 dist 仍走原结构
    setGlobalVariables('rssXmlPath', path.join(serverDataRootDirPath, 'rss.xml'));
    setGlobalVariables('sitemapXmlPath', path.join(serverDataRootDirPath, 'sitemap.xml'));
    setGlobalVariables('webAdminDistDirPath', path.join(serverRootDirPath, '../web-admin/dist'));
    setGlobalVariables('webAssetsDistDirPath', path.join(serverRootDirPath, '../web/dist'));
    setGlobalVariables('angularUiDistDirPath', path.join(serverRootDirPath, '../angular-ui/dist'));
}
