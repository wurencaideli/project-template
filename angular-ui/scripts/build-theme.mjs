import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import glob from 'glob';
import less from 'less';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const folderPath = path.join(__dirname, '../src/assets/themes');

// 匹配文件夹中的所有 .less 文件
glob(`${folderPath}/**/*.less`, {}, (err, files) => {
    if (err) {
        console.error('Error finding .less files:', err);
        return;
    }
    files.forEach((file) => {
        const lessContent = fs.readFileSync(file, 'utf8');
        less.render(
            lessContent,
            {
                paths: [
                    path.join(__dirname, '../src'), // 当前文件所在的目录
                ],
                filename: file,
            },
            (err, output) => {
                if (err) {
                    console.error('Error compiling LESS files:', err);
                    return;
                }
                const outputFilePath = file.replace('.less', '.css');
                fs.writeFileSync(outputFilePath, output.css, 'utf8');
                console.log(`LESS files packed into ${outputFilePath}`);
            },
        );
    });
});
