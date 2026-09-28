import { marked, Renderer } from 'marked';
import hljs from 'highlight.js';

const renderer = new Renderer();
renderer.code = ({ text, lang }) => {
    lang = lang || '';
    lang = lang.toLowerCase();
    const language = hljs.getLanguage(lang) ? (lang as string) : 'plaintext';
    const html = hljs.highlight(text, { language }).value;
    return `<pre><code class="hljs language-${language}">${html}</code></pre>`;
};
marked.use({ renderer });

/**
 * markdown 解析
 */
export async function markedParse(content: string) {
    return marked(content);
}
