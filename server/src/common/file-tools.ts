import fsExtra from 'fs-extra';

/** 写文件 */
export async function outputFile(filePath: string, content: string) {
    return fsExtra.outputFile(filePath, content, 'utf8');
}
/** 复制文件 */
export async function copy(filePath: string, filePath_1: string) {
    return fsExtra.copy(filePath, filePath_1);
}
/** 复制文件 */
export async function copySync(filePath: string, filePath_1: string) {
    return fsExtra.copySync(filePath, filePath_1);
}
/** 读文件 */
export async function readFile(filePath: string) {
    return fsExtra.readFile(filePath, 'utf8');
}
export function readFileSync(filePath: string) {
    return fsExtra.readFileSync(filePath, 'utf8');
}
/** 删除文件，文件夹 */
export async function deleteFile(filePath: string) {
    return fsExtra.remove(filePath);
}
export async function remove(filePath: string) {
    return fsExtra.remove(filePath);
}
export function removeSync(filePath: string) {
    return fsExtra.removeSync(filePath);
}
/** 创建文件夹 */
export async function ensureDir(dirPath: string) {
    return fsExtra.ensureDir(dirPath);
}
export function ensureDirSync(dirPath: string) {
    fsExtra.ensureDirSync(dirPath);
}
/** 验证是否是文件，可以不验证目录权限 */
export async function isFile(filePath: string) {
    const state: any = await fsExtra.stat(filePath).catch(() => false);
    if (!state || !state.isFile()) {
        return false;
    }
    return true;
}
/** 验证mime类型是否匹配，isValidMimeType('image/png','image/*'); true */
export function isValidMimeType(mimeType: string, pattern: string) {
    const regexPattern = pattern.replace(/\*/g, '.*');
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(mimeType);
}
