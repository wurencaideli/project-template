import qs from 'qs';

import { useApiService } from './request.ts';

const allApi = {
    info(params?: any) {
        return useApiService()({
            url: '/post/info/' + params.id,
            method: 'get',
            params: qs.parse(params),
        });
    },
    list(params?: any) {
        return useApiService()({
            url: '/post/list',
            method: 'get',
            params: qs.parse(params),
        });
    },
    add(params?: any) {
        return useApiService()({
            url: '/post/add',
            method: 'post',
            data: qs.parse(params),
        });
    },
    update(params?: any) {
        return useApiService()({
            url: '/post/update',
            method: 'put',
            data: qs.parse(params),
        });
    },
    updatePostInfoHtml(params?: any) {
        return useApiService()({
            url: '/post/update-post-info-html/' + params.id,
            method: 'put',
            data: qs.parse(params),
        });
    },
    updatePostHtml(params?: any) {
        return useApiService()({
            url: '/post/update-post-html',
            method: 'put',
            data: qs.parse(params),
        });
    },
    delete(params?: any) {
        return useApiService()({
            url: '/post/' + params.id,
            method: 'delete',
            params: qs.parse(params),
        });
    },
};

export default allApi;
