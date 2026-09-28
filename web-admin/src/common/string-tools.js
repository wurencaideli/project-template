/** 去除首尾空格 */
export function toTrim(str) {
    str = (str || '').replace(/^\s+|\s+$/g, '');
    return str;
}
/** 去除特殊符号 */
export function palindrome(str) {
    str = (str || '').replace(
        /[`:~!#$%^&*() \+ =<>?"{}|, \/ ;' \\ [ \] ~！#￥%……&*（） \+ ={}|《》？：“”【】、；‘’，。、]/g,
        '',
    );
    return str;
}
