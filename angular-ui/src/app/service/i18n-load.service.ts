import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';

const SUPPORTED_LANGS = ['en-US', 'zh-CN'] as const;
type SupportedLang = (typeof SUPPORTED_LANGS)[number];

/**
 * 负责应用启动时加载 i18n 资源、切换语言。
 * - 用 signal 暴露当前语言,模板可直接绑定
 * - 提供 instant / getI18nByKey 兼容旧代码
 */
@Injectable({
    providedIn: 'root',
})
export class I18nLoadService {
    private readonly http = inject(HttpClient);
    private readonly translate = inject(TranslateService);

    readonly currentLang = signal<SupportedLang>('zh-CN');

    getI18nByKey(key: string): string {
        return this.translate.instant(key);
    }

    instant(key: string): string {
        return this.translate.instant(key);
    }

    /** 读取本地或浏览器默认语言并归一化为支持的两种语言之一 */
    getLanguage(): SupportedLang {
        let stored = localStorage.getItem('language-option');
        if (stored === 'null' || stored == null) {
            stored = window.navigator.language;
        }
        if (stored === 'zh-CN' || stored === '"zh-CN"' || stored === 'zh') {
            return 'zh-CN';
        }
        return 'en-US';
    }

    /**
     * 启动时调用:下载并注册默认语言包,然后切到用户语言。
     * 下载失败放行,页面将显示原始 key,避免白屏。
     */
    async load(): Promise<void> {
        const language = this.getLanguage();
        try {
            await this.downloadLanguage(language);
        } catch {
            /* swallow, fallback to key */
        }
        this.translate.addLangs([...SUPPORTED_LANGS]);
        this.translate.setDefaultLang('zh-CN');
        this.useLanguage(language);
    }

    async downloadLanguage(language: SupportedLang): Promise<void> {
        const translations = await firstValueFrom(
            this.http.get(`${environment.deployUrl}/assets/i18n/${language}.json`),
        );
        // ngx-translate 的 TranslationObject 与 Record<string, unknown> 在严格模式下不兼容,
        // 但运行时结构是一致的(扁平 key → string),用 unknown 中转避开深度递归类型不匹配。
        this.translate.setTranslation(
            language,
            translations as unknown as Parameters<TranslateService['setTranslation']>[1],
        );
    }

    useLanguage(language: SupportedLang): void {
        this.currentLang.set(language);
        this.translate.use(language);
    }
}