import shortid from 'shortid';
import { v4 as uuidV4 } from 'uuid';

export function createShortid(): string {
    const _orderid = shortid.generate().replace(/-/g, 'A').replace(/_/g, 'a');
    return _orderid;
}
export function createUuid(): string {
    const token = uuidV4();
    return token;
}
