import { isPro } from './other-tools.js';

/**
 * 公共的json返回体
 * 200 请求成功
 * 400 参数错误
 * 401 凭证失效，需要重新获取
 * 409 重复添加数据
 * 429 请求过于频繁
 * 500 系统错误
 *  */
export class PublicReturn {
    status: number = 200;
    msg: string | undefined = '';
    data: any = null;
    isPro: boolean = isPro();
    version: string = process.env.DUMOGU_VERSION || '';
    constructor(status: number, msg?: string, data?: any) {
        this.status = status;
        this.msg = msg;
        this.data = data;
    }
}
