import {
    ApplicationConfig,
    provideAppInitializer,
    provideZonelessChangeDetection,
    inject,
} from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';

import { routes } from './app.routes';
import { I18nLoadService } from './service/i18n-load.service';

/**
 * 应用级 providers。
 * - zoneless 模式,组件自己负责通知更新
 * - 路由使用 hash 策略保持与旧版一致
 * - i18n 在启动器中预加载,语言由 I18nLoadService 决定,不在此硬编码
 *
 * 动画:Angular 22 起 `provideAnimations*` 系列已弃用,推荐改用模板里的
 * `animate.enter` / `animate.leave`。本项目没有用到 `[@trigger]` 或模块动画,
 * 所以这里不挂任何动画 provider。
 */
export const appConfig: ApplicationConfig = {
    providers: [
        provideZonelessChangeDetection(),
        provideRouter(routes, withHashLocation()),
        provideHttpClient(),
        provideTranslateService(),
        provideAppInitializer(() => inject(I18nLoadService).load()),
    ],
};