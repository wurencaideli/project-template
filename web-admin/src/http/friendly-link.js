import { service } from './request.js';
import qs from 'qs';

const allApi = {
    info(params) {
        return service({
            url: '/friendly-link/' + params.id,
            method: 'get',
            params: qs.parse(params),
        });
    },
    list(params) {
        return service({
            url: '/friendly-link/list',
            method: 'get',
            params: qs.parse(params),
        });
    },
    add(params) {
        return service({
            url: '/friendly-link',
            method: 'post',
            data: qs.parse(params),
        });
    },
    update(params) {
        return service({
            url: '/friendly-link/' + (params.uId || params.id),
            method: 'put',
            data: qs.parse(params),
        });
    },
    updateHtml(params) {
        return service({
            url: '/friendly-link/update-html',
            method: 'put',
            data: qs.parse(params),
        });
    },
    delete(params) {
        return service({
            url: '/friendly-link/' + (params.ids || params.id),
            method: 'delete',
            params: qs.parse(params),
        });
    },
};

export default allApi;
