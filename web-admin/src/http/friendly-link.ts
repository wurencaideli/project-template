import qs from 'qs';

import { useApiService } from './request.ts';

const allApi = {
    info(params?: any) {
        return useApiService()({
            url: '/friendly-link/' + params.id,
            method: 'get',
            params: qs.parse(params),
        });
    },
    list(params?: any) {
        return useApiService()({
            url: '/friendly-link/list',
            method: 'get',
            params: qs.parse(params),
        });
    },
    add(params?: any) {
        return useApiService()({
            url: '/friendly-link',
            method: 'post',
            data: qs.parse(params),
        });
    },
    update(params?: any) {
        return useApiService()({
            url: '/friendly-link/' + (params.uId || params.id),
            method: 'put',
            data: qs.parse(params),
        });
    },
    updateHtml(params?: any) {
        return useApiService()({
            url: '/friendly-link/update-html',
            method: 'put',
            data: qs.parse(params),
        });
    },
    delete(params?: any) {
        return useApiService()({
            url: '/friendly-link/' + (params.ids || params.id),
            method: 'delete',
            params: qs.parse(params),
        });
    },
};

export default allApi;
