import { service } from './request.js';
import qs from 'qs';

const allApi = {
    info(params) {
        return service({
            url: '/file/info/' + params.fileName,
            method: 'get',
            params: qs.parse(params),
        });
    },
    list(params) {
        return service({
            url: '/file/list',
            method: 'get',
            params: qs.parse(params),
        });
    },
    upload(params) {
        return service({
            url: '/file/upload',
            method: 'post',
            data: qs.parse(params),
        });
    },
    upload_: service.defaults.baseURL + '/file/upload',
    delete(params) {
        return service({
            url: '/file/' + params.fileName,
            method: 'delete',
            params: qs.parse(params),
        });
    },
};

export default allApi;
