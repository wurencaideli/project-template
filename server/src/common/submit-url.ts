import got from 'got';

/** 提交链接到必应 */
export function submitBing(url: string, site: string, key: string): any {
    return got
        .post('https://ssl.bing.com/webmaster/api.svc/json/SubmitUrl', {
            searchParams: { apikey: key },
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                Host: 'ssl.bing.com',
            },
            json: {
                siteUrl: site,
                url: url,
            },
            timeout: { request: 3000 },
            responseType: 'json',
        })
        .then((res: any) => {
            const data: any = res.body || {};
            if (data.d !== null) throw '提交失败';
            return data;
        });
}
/** 提交链接到百度 */
export function submitBaiDu(url: string, site: string, key: string): any {
    return got
        .post('http://data.zz.baidu.com/urls', {
            searchParams: {
                site: site,
                token: key,
            },
            body: url,
            headers: {},
            timeout: {
                request: 3000,
            },
            responseType: 'json',
        })
        .then((res: any) => {
            const data: any = res.body || {};
            if (data.success != 1) throw '提交失败';
            return data;
        });
}
