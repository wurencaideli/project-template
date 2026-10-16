/** 去除首尾空格 */
export function toTrim(str: string) {
    str = (str || '').replace(/^\s+|\s+$/g, '');
    return str;
}
/** 去除特殊符号 */
export function palindrome(str: string) {
    str = (str || '').replace(
        /[`:~!#$%^&*() \+ =<>?"{}|, \/ ;' \\ [ \] ~！#￥%……&*（） \+ ={}|《》？：“”【】、；‘’，。、]/g,
        '',
    );
    return str;
}
