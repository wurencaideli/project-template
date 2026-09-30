import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import { isEnglish } from '../utils/common.utils';
import { useLanguageStorage } from '../action/storage-manage';

const SUPPORTED_LANGS = ['en-US', 'zh-CN'] as const;
type SupportedLang = (typeof SUPPORTED_LANGS)[number];

@Injectable({
    providedIn: 'root',
})
export class I18nLoadService {
    private readonly http = inject(HttpClient);
    private readonly translate = inject(TranslateService);
    currentLang: SupportedLang = 'zh-CN';
    getI18nByKey(key: string): string {
        return this.translate.instant(key);
    }
    instant(key: string): string {
        return this.translate.instant(key);
    }
    /** 读取本地或浏览器默认语言并归一化为支持的两种语言之一 */
    getLanguage(): SupportedLang {
        const stored = (useLanguageStorage().value as string) || '';
        return isEnglish(stored) ? 'en-US' : 'zh-CN';
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
        this.translate.setFallbackLang('zh-CN');
        this.useLanguage(language);
    }
    async downloadLanguage(language: SupportedLang): Promise<void> {
        const translations = await firstValueFrom(
            this.http.get(`${environment.deployUrl}/assets/i18n/${language}.json`),
        );
        this.translate.setTranslation(
            language,
            translations as unknown as Parameters<TranslateService['setTranslation']>[1],
        );
    }
    useLanguage(language: SupportedLang): void {
        this.currentLang = language;
        this.translate.use(language);
    }
}
