import { service } from './request.js';
import qs from 'qs';

const allApi = {
    info(params) {
        return service({
            url: '/post/info/' + params.id,
            method: 'get',
            params: qs.parse(params),
        });
    },
    list(params) {
        return service({
            url: '/post/list',
            method: 'get',
            params: qs.parse(params),
        });
    },
    add(params) {
        return service({
            url: '/post/add',
            method: 'post',
            data: qs.parse(params),
        });
    },
    update(params) {
        return service({
            url: '/post/update',
            method: 'put',
            data: qs.parse(params),
        });
    },
    updatePostInfoHtml(params) {
        return service({
            url: '/post/update-post-info-html/' + params.id,
            method: 'put',
            data: qs.parse(params),
        });
    },
    updatePostHtml(params) {
        return service({
            url: '/post/update-post-html',
            method: 'put',
            data: qs.parse(params),
        });
    },
    delete(params) {
        return service({
            url: '/post/' + params.id,
            method: 'delete',
            params: qs.parse(params),
        });
    },
};

export default allApi;
