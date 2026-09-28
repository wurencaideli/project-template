import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// 构建产物预压缩:遍历 dist 目录,为文本类静态资源生成同名 .gz 文件,
// 配合 nginx `gzip_static on` 直接返回预压缩文件(响应带 Content-Length,不再 chunked)。
//
// 仅压缩文本类资源。
// 排除 .html:外网网关若对 html 做内容注入(sub_filter),预压缩会让注入失效;
// 排除 woff2/图片等本身已是压缩格式的文件,压缩无收益。
const COMPRESSIBLE_EXT = new Set(['.js', '.css', '.svg', '.ico', '.json', '.txt', '.xml', '.webmanifest']);
// 小于 1KB 的文件压缩收益可忽略
const MIN_SIZE = 1024;

function gzipDir(dir) {
    let count = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            count += gzipDir(fullPath);
            continue;
        }
        if (entry.name.endsWith('.gz') || !COMPRESSIBLE_EXT.has(path.extname(entry.name).toLowerCase())) {
            continue;
        }
        if (fs.statSync(fullPath).size < MIN_SIZE) {
            continue;
        }
        fs.writeFileSync(`${fullPath}.gz`, zlib.gzipSync(fs.readFileSync(fullPath), { level: 9 }));
        count++;
    }
    return count;
}

const distDir = process.argv[2] || 'dist';
if (!fs.existsSync(distDir)) {
    console.error(`dist 目录不存在: ${distDir}(用法: node scripts/gzip-dist.mjs [dist目录])`);
    process.exit(1);
}
console.log(`✅ Gzipped ${gzipDir(distDir)} files under ${distDir}`);
