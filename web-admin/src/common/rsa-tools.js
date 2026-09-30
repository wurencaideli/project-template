import forge from 'node-forge';

/** 公钥加密 */
export function publicEncrypt(plainText, publicKeyPem) {
    try {
        const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
        const plainTextBytes = forge.util.encodeUtf8(plainText);
        const encryptedBytes = publicKey.encrypt(plainTextBytes, 'RSA-OAEP', {
            md: forge.md.sha256.create(),
            mgf1: { md: forge.md.sha256.create() },
        });
        return forge.util.encode64(encryptedBytes);
    } catch (error) {
        throw `加密失败：${error.message}`;
    }
}
