import { compressHtml } from '../common/build-tools.js';

const html404Template = `
<!DOCTYPE html>
<html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <title>404 - 页面未找到</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            html,
            body {
                height: 100%;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                    "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB",
                    "Microsoft YaHei", sans-serif;
                background: #f5f7fa;
                color: #1f2937;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px;
            }
            .card {
                max-width: 480px;
                width: 100%;
                background: #fff;
                border-radius: 16px;
                box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08),
                    0 1px 3px rgba(15, 23, 42, 0.04);
                padding: 48px 32px;
                text-align: center;
            }
            .code {
                font-size: 96px;
                font-weight: 700;
                line-height: 1;
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                -webkit-background-clip: text;
                background-clip: text;
                color: transparent;
                letter-spacing: -0.02em;
            }
            .title {
                margin-top: 16px;
                font-size: 22px;
                font-weight: 600;
                color: #111827;
            }
            .desc {
                margin-top: 12px;
                font-size: 14px;
                line-height: 1.7;
                color: #6b7280;
            }
            .actions {
                margin-top: 28px;
                display: flex;
                gap: 12px;
                justify-content: center;
                flex-wrap: wrap;
            }
            .btn {
                display: inline-block;
                padding: 10px 20px;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 500;
                text-decoration: none;
                transition: transform 0.15s ease, box-shadow 0.15s ease;
            }
            .btn-primary {
                background: #6366f1;
                color: #fff;
            }
            .btn-primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
            }
            .btn-ghost {
                background: #f3f4f6;
                color: #374151;
            }
            .btn-ghost:hover {
                background: #e5e7eb;
            }
            @media (prefers-color-scheme: dark) {
                body {
                    background: #0f172a;
                    color: #e5e7eb;
                }
                .card {
                    background: #1e293b;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
                }
                .desc {
                    color: #94a3b8;
                }
                .btn-ghost {
                    background: #334155;
                    color: #e2e8f0;
                }
                .btn-ghost:hover {
                    background: #475569;
                }
                .title {
                    color: #f1f5f9;
                }
            }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="code">404</div>
            <h1 class="title">页面未找到</h1>
            <p class="desc">
                您访问的资源不存在或已被移除。<br>
                请检查链接是否正确，或返回首页继续浏览。
            </p>
            <div class="actions">
                <a class="btn btn-primary" href="/">返回首页</a>
                <a class="btn btn-ghost" href="javascript:history.back()">返回上一页</a>
            </div>
        </div>
    </body>
</html>
`;

const data: any = {
    html404Str: compressHtml(html404Template),
};
/** 设置全局变量 */
export function setGlobalVariables(key: string, value: any) {
    (data as any)[key] = value;
}
export function getGlobalVariables(key: string) {
    return data[key];
}