import forge from 'node-forge';

let publicKey: string = '';
let privateKey: string = '';
let key: any;
/** 生成密钥 */
export function generateRSAKeyPair() {
    key = forge.pki.rsa.generateKeyPair(2048);
    publicKey = forge.pki.publicKeyToPem(key.publicKey);
    privateKey = forge.pki.privateKeyToPem(key.privateKey);
}
/** 获取公钥 */
export function getPublicKey() {
    return publicKey;
}
/** 公钥加密 */
export function publicEncrypt(plainText: string) {
    try {
        const plainTextBytes = forge.util.encodeUtf8(plainText);
        const encryptedBytes = key.publicKey.encrypt(plainTextBytes, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: { md: forge.md.sha256.create() },
        });
        return forge.util.encode64(encryptedBytes);
    } catch (error: any) {
        throw `加密失败：${error.message}`;
    }
}
/** 私钥解密 */
export function privateDecrypt(encryptedBase64: string) {
    try {
        const encryptedBytes = forge.util.decode64(encryptedBase64);
        const decryptedBytes = key.privateKey.decrypt(encryptedBytes, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: { md: forge.md.sha256.create() },
        });
        return forge.util.decodeUtf8(decryptedBytes);
    } catch (error: any) {
        throw `解密失败：${error.message}`;
    }
}
