import RSS from 'rss';

import { outputFile } from '../common/file-tools.js';
import { getGlobalVariables } from '../action/setup-global-variables.js';
import * as userServer from './user.js';

export async function update() {
    const { DUMOGU_Domain } = process.env;
    const user: any = (await userServer.getCurrUserSync()) || {};
    const feed = new RSS({
        title: user.nickname || '',
        description: user.synopsis || '',
        feed_url: `https://${DUMOGU_Domain}/rss.xml`,
        site_url: `https://${DUMOGU_Domain}`,
        language: 'zh-CN',
        pubDate: new Date(),
        ttl: 60,
    });
    [
        {
            title: '首页',
            href: '/',
        },
        {
            title: '关于',
            href: '/about',
        },
        {
            title: '标签',
            href: '/tags',
        },
        {
            title: '归档',
            href: '/archive',
        },
        {
            title: '友情链接',
            href: '/friendly-link',
        },
    ].forEach((item: any) => {
        feed.item({
            title: item.title,
            url: item.href,
            date: new Date(),
            description: item.title,
        });
    });
    const xml = feed.xml({ indent: true });
    await outputFile(getGlobalVariables('rssXmlPath'), xml);
}
