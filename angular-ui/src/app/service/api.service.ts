import { Injectable, inject } from '@angular/core';

import { HttpService } from './http.service';
import { environment } from '../../environments/environment';

/**
 * 大屏接口层:统计类接口由项目内 server 服务端提供(Fastify,views/dashboard.ts)。
 * 返回体为服务端统一的 PublicReturn 信封 {status, msg, data},数据负载在 data 字段,由使用方自行取用。
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
    private readonly httpService = inject(HttpService);
    /** 顶部汇总卡片统计。约定:卡片 N 的数值字段为 numberN,说明文字字段为 textN,走势数组字段为 chartN(近 24 小时,索引 0 为最早) */
    summaryStatistics(params: any): any {
        return this.httpService.post(this.httpService.baseApi + '/dashboard/summary', {}, params);
    }
    /** 按天统计(dashboard-one 折线图)。约定:day 为 'YYYY-MM-DD',系列 N 的数量字段为 countN */
    dailyCountStatistics(params: any): any {
        return this.httpService.post(this.httpService.baseApi + '/dashboard/daily-count', {}, params);
    }
    /** 分类统计(dashboard-one 柱状图)。约定:类目字段为 name(「类别N」占位),数量字段为 count */
    categoryStatistics(params: any): any {
        return this.httpService.post(this.httpService.baseApi + '/dashboard/category-count', {}, params);
    }
    /** 等级分布(饼图)。约定:等级字段 level 取值 '01'~'04',数量字段为 count */
    levelStatistics(params: any): any {
        return this.httpService.post(this.httpService.baseApi + '/dashboard/level-count', {}, params);
    }
    /** 类型统计(dashboard-one 底部柱状图)。约定:类目字段为 name(「类别N」占位),数量字段为 count */
    typeStatistics(params: any): any {
        return this.httpService.post(this.httpService.baseApi + '/dashboard/type-count', {}, params);
    }
    /** 区域统计(地图组件):一次请求返回全部区域数据。约定:入参 regions 传区域名列表,返回 name/count */
    regionStatistics(params: any): any {
        return this.httpService.post(this.httpService.baseApi + '/dashboard/region-count', {}, params);
    }
    /** 大屏模板配置:标题/地图类型(dashboard-one 启动时拉取写入 commonData) */
    queryDashboardConfig(_params: any): any {
        return this.httpService.post(this.httpService.baseApi + '/dashboard/config', {}, _params);
    }
    /** 地图 GeoJSON:直接读取本地 assets 静态资源,无需后端 */
    getGeoData(mapType: any): any {
        const url = `${environment.deployUrl}/assets/geo/${mapType}.json`;
        return this.httpService.get(url, {});
    }
}
