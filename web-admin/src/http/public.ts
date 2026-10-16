import qs from 'qs';

import { useApiService } from './request.ts';

const allApi = {
    /** 验证码，目前由系统写死 */
    captcha() {
        return Promise.resolve({
            msg: '操作成功',
            code: 200,
            data: {
                key: 'captcha',
                svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="36" viewBox="0 0 100 36"><rect width="100" height="36" rx="4" fill="#f2f3f5"/><text x="50" y="24" text-anchor="middle" font-size="16" fill="#5340ff" font-family="monospace">1234</text></svg>',
            },
        });
    },
    /** RSA公钥，目前由系统写死 */
    rsaPublicKey() {
        return Promise.resolve({
            msg: '操作成功',
            code: 200,
            data: '-----BEGIN PUBLIC KEY-----\r\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1Gs8E+R1QcV2ocQ2Ey5t\r\nSydkXIsnM2Xyr5XdFbds+xX/8Za4QpGLx/zmaiXlhx2elXJWH6tS3hqa6KEH/OaE\r\nmZ9gVzbE05bVBEDFWZoL3zl/KNevDGDj/SbBk9GFr21VX/rspxI1Hk6mCRqyZTss\r\nuWRmvyXOcGjfxb4yK40VFPg9beR+Bv9U4/p6f6Ycq283V0RGI/qxORUrpWFw3pzF\r\npd5NadfJIqia6iSO3eYvZwP33XCBZdGNtAWX84mOKC9xfnkNgPcfuUUv536vKaVD\r\nTXe2mm5HwZAqi1yL/HbBNqIyI8Ro/alkf1M0qr91Ajvnf3eUfnpyVHFX4BpN5iIh\r\nGwIDAQAB\r\n-----END PUBLIC KEY-----\r\n',
        });
    },
    initData(params?: any) {
        return useApiService()({
            url: '/system/init-data',
            method: 'post',
            data: qs.parse(params),
        });
    },
    postRemoveRedundancy(params?: any) {
        return useApiService()({
            url: '/system/post-remove-redundancy',
            method: 'post',
            data: qs.parse(params),
        });
    },
    fileRemoveRedundancy(params?: any) {
        return useApiService()({
            url: '/system/file-remove-redundancy',
            method: 'post',
            data: qs.parse(params),
        });
    },
    createHtml(params?: any) {
        return useApiService()({
            url: '/system/create-html',
            method: 'post',
            data: qs.parse(params),
        });
    },
    removeAllHtml(params?: any) {
        return useApiService()({
            url: '/system/remove-all-html',
            method: 'post',
            data: qs.parse(params),
        });
    },
    htmlRemoveRedundancy(params?: any) {
        return useApiService()({
            url: '/system/html-remove-redundancy',
            method: 'post',
            data: qs.parse(params),
        });
    },
    rssUpdate(params?: any) {
        return useApiService()({
            url: '/system/rss/update',
            method: 'put',
            data: qs.parse(params),
        });
    },
    sitemapUpdate(params?: any) {
        return useApiService()({
            url: '/system/sitemap/update',
            method: 'put',
            data: qs.parse(params),
        });
    },
    handleWriteInPostList(params?: any) {
        return useApiService()({
            url: '/system/handle-write-in-post-list',
            method: 'put',
            data: qs.parse(params),
        });
    },
};

export default allApi;
