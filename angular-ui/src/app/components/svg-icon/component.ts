import {
    ChangeDetectionStrategy,
    Component,
    effect,
    inject,
    input,
    signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { lastValueFrom } from 'rxjs';

/**
 * 通过 HTTP 加载 SVG 内容并使用 [innerHTML] 渲染。
 * - 输入是 signal(`input()` API),变更通过 effect() 自动重新加载。
 * - 同一 url 的多次请求走 in-memory 缓存。
 */
@Component({
    selector: 'svg-icon',
    standalone: true,
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SvgIconComponent {
    readonly name = input.required<string>();
    readonly svgSrcPath = input<string>('assets/icon-images/');

    readonly svgContent = signal<SafeHtml>('');

    private readonly http = inject(HttpClient);
    private readonly sanitizer = inject(DomSanitizer);

    constructor() {
        effect(() => {
            const name = this.name();
            const path = this.svgSrcPath();
            this.loadSvg(`${path}${name}.svg`);
        });
    }

    private async loadSvg(url: string): Promise<void> {
        const cached = cache.get(url);
        if (cached) {
            this.svgContent.set(cached);
            return;
        }
        try {
            const raw = await lastValueFrom(this.http.get(url, { responseType: 'text' }));
            const safe = this.sanitizer.bypassSecurityTrustHtml(sanitizeSvg(raw));
            cache.set(url, safe);
            this.svgContent.set(safe);
        } catch {
            this.svgContent.set('');
        }
    }
}

const cache = new Map<string, SafeHtml>();

/** 过滤 svg 中的 script / on* 事件属性,避免 XSS */
export function sanitizeSvg(svg: string): string {
    return svg
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/g, '')
        .replace(/on\w+='[^']*'/g, '')
        .replace(/javascript:/gi, '')
        .replace(/<foreignObject\b[^<]*(?:(?!<\/foreignObject>)<[^<]*)*<\/foreignObject>/gi, '')
        .replace(/href="javascript:[^"]*"/gi, '')
        .replace(/xlink:href="javascript:[^"]*"/gi, '');
}