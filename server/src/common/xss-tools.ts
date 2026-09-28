import xss from 'xss';
import he from 'he';
import jsStringEscape_ from 'js-string-escape';

/**
 * HTML 转纯文本（通用版，无依赖）
 */
export function htmlToText(html: string | null | undefined) {
    if (!html) return '';
    html = String(html);
    return he.encode(html, {
        encodeEverything: false,
        useNamedReferences: true,
    });
}
/** 过滤掉 */
export function mdHtmlXssFilter(content: string | null | undefined): string {
    if (!content) return '';
    content = String(content);
    const xssOptions = {
        whiteList: {},
        stripIgnoreTag: false,
        stripIgnoreTagAttr: false,
        onTag: function (tag: string, html: string) {
            if (tag.toLowerCase() === 'script') {
                return '';
            }
            return html;
        },
    };
    return xss(content, xssOptions);
}
/** 将任何字符串转义为双引号或单引号内的有效 JavaScript 字符串字面量。 */
export function jsStringEscape(jsString: string | null | undefined) {
    if (!jsString) return '';
    jsString = String(jsString);
    return jsStringEscape_(jsString);
}
