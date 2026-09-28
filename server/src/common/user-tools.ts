import bcrypt from 'bcryptjs';
import { v4 as uuidV4 } from 'uuid';

/**
 * hash密码，需要盐
 */
export function hashPassword(password: string, saltRounds = 8): string {
    const hash = bcrypt.hashSync(password, saltRounds);
    return hash;
}
/**
 * 验证密码
 */
export function comparePassword(password: string, hashPassword_: string): boolean {
    return bcrypt.compareSync(password, hashPassword_);
}
/**
 * 创建token
 */
export function createToken(): string {
    const token = uuidV4();
    return token;
}
