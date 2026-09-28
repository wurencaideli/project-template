/** 生成验证器 */
export function createValidatorFn(validator?: any) {
    return (value: any) => {
        const resName = validator.safeParse(value, { abortEarly: true });
        if (!resName.success) {
            return resName.error.issues
                .map((i: any) => `${i.path.join('.')}: 需要 ${i.expected}, 实际收到 ${i.received}`)
                .join(';');
        } else {
            return undefined;
        }
    };
}
