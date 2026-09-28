import { Injectable } from '@angular/core';
import {
    HttpHeaders,
    HttpClient,
    HttpParams,
    HttpEventType,
    HttpContext,
} from '@angular/common/http';
import { saveAs } from 'file-saver';
import { I18nLoadService } from './i18n-load.service';
import { environment } from '../../environments/environment';
import { timeout, catchError } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { getQueryParam } from '../utils/common.utils';

@Injectable({ providedIn: 'root' })
export class HttpService {
    environment__ = environment;
    baseApi = '';
    severityOptions = [];
    severityOptionMap = {};
    chinaJson: any;
    constructor(
        private httpClient: HttpClient,
        private i18nLoadService: I18nLoadService,
    ) {
        this.baseApi = this.environment__.baseApi;
    }
    getLanguage() {
        return this.i18nLoadService.getLanguage();
    }
    getToken() {
        return window.localStorage.getItem('csrftoken') || '';
    }
    getProxy() {
        return getQueryParam(location.href, 'api-proxy') || '';
    }
    getHeader() {
        const token: any = this.getToken();
        const language: any = this.getLanguage();
        return {
            'Content-Type': 'application/json',
            forgerydefense: token.substr(1, token.length - 2),
            'language-option': language.substring(1, language.length - 1),
        };
    }
    /**
     * 包装接口 Promise，统一获取接口返回的响应体数据。
     */
    unwrapResponse<T = any>(promise: Promise<T>): Promise<any> {
        return promise.catch((error: any) => {
            // 1) 接口返回了非 2xx 响应 → 用后端响应体归一化
            if (error instanceof HttpErrorResponse) {
                const body = error.error;
                // 响应体为对象 → 合并，响应体自身字段优先（可覆盖兜底 message）
                if (body && typeof body === 'object') {
                    body.httpStatusCode = error.status;
                    throw body;
                }
                // 响应体为非空字符串 → 包成 { message }
                if (typeof body === 'string' && body !== '') {
                    throw { message: body, httpStatusCode: error.status };
                }
                throw { message: error.message, httpStatusCode: error.status };
            }
            // 2) 非 HttpErrorResponse → 属于代码执行错误（异常、逻辑错误、手动 throw 等）
            //    按【带 message 的对象】规范统一，并在 __originalError 保留原始对象便于排查
            const message =
                (typeof error === 'string' && error) ||
                error?.message ||
                error?.statusText ||
                '代码执行异常，请联系管理员';
            throw { message, __originalError: error };
        });
    }
    /** post请求 */
    post<T = any>(url: string, requestParams: any, requestBody: any): Promise<T> {
        return firstValueFrom(
            this.httpClient.post<T>(url, requestBody, {
                responseType: 'json',
                headers: new HttpHeaders(this.getHeader()),
                params: new HttpParams({ fromObject: requestParams }),
            }),
        );
    }
    /** get请求 */
    get<T = any>(url: string, requestParams: any): Promise<T> {
        return firstValueFrom(
            this.httpClient.get<T>(url, {
                responseType: 'json',
                headers: new HttpHeaders(this.getHeader()),
                params: new HttpParams({ fromObject: requestParams }),
            }),
        );
    }
}
