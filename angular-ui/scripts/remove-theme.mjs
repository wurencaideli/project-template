import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import glob from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const folderPath = path.join(__dirname, '../src/assets/themes');

glob(`${folderPath}/**/*.css`, {}, (err, files) => {
    if (err) {
        console.error('Error finding .css files:', err);
        return;
    }
    files.forEach((file) => {
        fs.unlink(file, (err) => {
            if (err) {
                console.error('Error deleting file:', err);
            } else {
                console.log(`Deleted file: ${file}`);
            }
        });
    });
});
