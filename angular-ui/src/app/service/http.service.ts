import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HttpService {
    baseApi = '';
    constructor(private httpClient: HttpClient) {
        this.baseApi = environment.baseApi;
    }
    getHeader() {
        return {
            'Content-Type': 'application/json',
        };
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
