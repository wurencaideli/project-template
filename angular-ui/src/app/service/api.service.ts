import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient, HttpParams } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ApiService {
    constructor(
        private httpClient: HttpClient,
        private translate: TranslateService,
    ) {}
    getLanguage() {
        return this.translate.currentLang;
    }
    getToken() {
        return window.localStorage.getItem('csrftoken') || '';
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
            if (error instanceof HttpErrorResponse) {
                const body = error.error;
                if (body && typeof body === 'object') {
                    body.httpStatusCode = error.status;
                    throw body;
                }
                if (typeof body === 'string' && body !== '') {
                    throw { message: body, httpStatusCode: error.status };
                }
                throw { message: error.message, httpStatusCode: error.status };
            }
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
    // ===== 以下为示例接口方法（仅保留一个作参考，按需删改） =====
    /** 示例：分页查询文件列表 */
    queryDisTemplate(body: any): any {
        const url = '/api/fms-event-monitor/v1/dashboard/query/dis_template';
        return this.get(url, body);
    }
}
