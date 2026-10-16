import { ElMessage, ElMessageBox } from 'element-plus';
import 'element-plus/es/components/message/style/css';
import 'element-plus/es/components/message-box/style/css';

/** 成功的消息 */
export function messageSuccess(...params: any) {
    return ElMessage.success(...params);
}
/** 失败的消息 */
export function messageError(...params: any) {
    return ElMessage.error(...params);
}
/** alert */
export function alert(...params: any) {
    return (ElMessageBox.alert as any)(...params);
}
export function confirm(...params: any) {
    return (ElMessageBox.confirm as any)(...params);
}
export function prompt(...params: any) {
    return (ElMessageBox.prompt as any)(...params);
}
