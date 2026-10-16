import axios from 'axios';

import { userDataStore } from '~/store/user.ts';
import { confirm } from '~/action/message-prompt.ts';
import { useRouter } from '~/router/index.ts';

let apiService: any;

export function useApiService() {
    if (apiService) return apiService;
    const baseApiURL = import.meta.env.VITE_APP_baseApiURL;
    const timeout = 13000;
    apiService = axios.create({
        baseURL: baseApiURL,
        timeout: timeout,
    });
    apiService.interceptors.request.use(
        (config: any) => {
            const userData = userDataStore();
            config.headers = (config.headers || {}) as any;
            config.headers['token'] = userData.token;
            return config;
        },
        () => {
            return Promise.reject({
                msg: '请求发生错误，请稍后再试',
            });
        },
    );
    let modelShow = false;
    apiService.interceptors.response.use(
        (response: any) => {
            const data = response.data;
            if (!data) {
                return Promise.reject({
                    msg: '请求发生错误',
                });
            }
            return data;
        },
        (e: any) => {
            const data = e?.response?.data || {};
            const status = data.status;
            switch (status) {
                case 401:
                    if (!modelShow) {
                        modelShow = true;
                        confirm('登录已经失效，是否重新登录？', '登录失效', {
                            confirmButtonText: '确定',
                            cancelButtonText: '取消',
                            type: 'warning',
                        })
                            .then(() => {
                                useRouter().push({
                                    path: '/login',
                                });
                            })
                            .catch(() => {})
                            .finally(() => {
                                modelShow = false;
                            });
                    }
                    return Promise.reject(data);
                default:
                    return Promise.reject(data);
            }
        },
    );
    return apiService;
}
