import axios from 'axios';
import { userDataStore } from '@/store/user.js';
import { confirm } from '@/action/message-prompt.js';
import router from '@/router/index.js';

const baseApiURL = import.meta.env.VITE_APP_baseApiURL; //api原始链接
const timeout = 13000; //api请求超时时间

export const service = axios.create({
    //可创建多个 axios实例
    baseURL: baseApiURL, //设置公共的请求前缀
    timeout: timeout, //超时终止请求
});

service.interceptors.request.use(
    (config) => {
        const userData = userDataStore();
        config.headers = config.headers || {};
        config.headers['token'] = userData.userInfo.token;
        return config;
    },
    () => {
        return Promise.reject({
            msg: '请求发生错误，请稍后再试',
        });
    },
);

let modelShow = false;
service.interceptors.response.use(
    (response) => {
        const data = response.data;
        if (!data) {
            return Promise.reject({
                msg: '请求发生错误',
            });
        }
        return data;
    },
    (e) => {
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
                            router.push({
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
