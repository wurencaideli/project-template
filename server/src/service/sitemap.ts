import { SitemapStream, streamToPromise } from 'sitemap';
import { Readable } from 'stream';

import { outputFile } from '../common/file-tools.js';
import { getGlobalVariables } from '../action/setup-global-variables.js';

/** 更新 */
export async function update() {
    const { PROJECT_DOMAIN } = process.env;
    const PROJECT_BASE_HREF = process.env.PROJECT_BASE_HREF || '/';
    const nowDate = new Date();
    const links: any = [
        { url: '', changefreq: 'daily', priority: 1.0 },
        { url: 'about', changefreq: 'monthly', priority: 0.8, lastmod: nowDate },
        { url: 'tags', changefreq: 'weekly', priority: 0.9, lastmod: nowDate },
        { url: 'archive', changefreq: 'weekly', priority: 0.9, lastmod: nowDate },
        {
            url: 'friendly-link',
            changefreq: 'weekly',
            priority: 0.9,
            lastmod: nowDate,
        },
    ];
    const stream = new SitemapStream({ hostname: `https://${PROJECT_DOMAIN}${PROJECT_BASE_HREF}` });
    const xml = await streamToPromise(Readable.from(links).pipe(stream)).then((data) =>
        data.toString(),
    );
    await outputFile(getGlobalVariables('sitemapXmlPath'), xml);
}
