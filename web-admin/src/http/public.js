import { service } from './request.js';
import qs from 'qs';

const allApi = {
    captcha() {
        return service({
            url: '/public/captcha',
            method: 'get',
        });
    },
    rsaPublicKey() {
        return service({
            url: '/public/rsa-public-key',
            method: 'get',
        });
    },
    initData(params) {
        return service({
            url: '/system/init-data',
            method: 'post',
            data: qs.parse(params),
        });
    },
    postRemoveRedundancy(params) {
        return service({
            url: '/system/post-remove-redundancy',
            method: 'post',
            data: qs.parse(params),
        });
    },
    fileRemoveRedundancy(params) {
        return service({
            url: '/system/file-remove-redundancy',
            method: 'post',
            data: qs.parse(params),
        });
    },
    createHtml(params) {
        return service({
            url: '/system/create-html',
            method: 'post',
            data: qs.parse(params),
        });
    },
    removeAllHtml(params) {
        return service({
            url: '/system/remove-all-html',
            method: 'post',
            data: qs.parse(params),
        });
    },
    htmlRemoveRedundancy(params) {
        return service({
            url: '/system/html-remove-redundancy',
            method: 'post',
            data: qs.parse(params),
        });
    },
    rssUpdate(params) {
        return service({
            url: '/system/rss/update',
            method: 'put',
            data: qs.parse(params),
        });
    },
    sitemapUpdate(params) {
        return service({
            url: '/system/sitemap/update',
            method: 'put',
            data: qs.parse(params),
        });
    },
    handleWriteInPostList(params) {
        return service({
            url: '/system/handle-write-in-post-list',
            method: 'put',
            data: qs.parse(params),
        });
    },
};

export default allApi;
