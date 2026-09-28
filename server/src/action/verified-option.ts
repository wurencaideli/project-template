import * as z from 'zod';

import { createValidatorFn } from '../common/zod-tools.js';

/** 所有字段的验证器 */
const allValidators = {
    uId: z.string().min(3).max(30),
    hidden: z.boolean(),
    pinned: z.boolean(),
    friendlyLink: {
        name: z.string().min(1).max(300),
        link: z.string().min(1).max(700),
        icon: z.string().min(0).max(700),
        content: z.string().min(0).max(1500),
    },
    user: {
        nickname: z.string().min(1).max(300),
        password: z.string().min(1).max(300),
        synopsis: z.string().min(0).max(700),
        avatar: z.string().min(0).max(700),
        about: z.string().min(0).max(15000),
    },
};
/** 组合验证器 */
const friendlyLinkAddValidator = z.object({
    name: allValidators.friendlyLink.name,
    link: allValidators.friendlyLink.link,
    icon: allValidators.friendlyLink.icon.optional(),
    content: allValidators.friendlyLink.content.optional(),
    hidden: allValidators.hidden,
});
export const friendlyLinkAddValidatorFn = createValidatorFn(friendlyLinkAddValidator);
/** 组合验证器 */
const friendlyLinkUpdateValidator = z.object({
    uId: allValidators.uId,
    name: allValidators.friendlyLink.name.optional(),
    link: allValidators.friendlyLink.link.optional(),
    icon: allValidators.friendlyLink.icon.optional(),
    content: allValidators.friendlyLink.content.optional(),
    hidden: allValidators.hidden,
});
export const friendlyLinkUpdateValidatorFn = createValidatorFn(friendlyLinkUpdateValidator);
/** 组合验证器 */
const userUpdateValidator = z.object({
    uId: allValidators.uId,
    nickname: allValidators.user.nickname.optional(),
    synopsis: allValidators.user.synopsis.optional(),
    avatar: allValidators.user.avatar.optional(),
    about: allValidators.user.about.optional(),
});
export const userUpdateValidatorFn = createValidatorFn(userUpdateValidator);
/** 组合验证器 */
const userRegisterValidator = z.object({
    name: z.string().min(3).max(30),
    password: allValidators.user.password,
    secret: z.string().min(8).max(64),
});
export const userRegisterValidatorFn = createValidatorFn(userRegisterValidator);
/** 组合验证器 */
const userChangePasswordValidator = z.object({
    secret: z.string().min(8).max(64),
    oldPassword: allValidators.user.password,
    newPassword: allValidators.user.password,
});
export const userChangePasswordValidatorFn = createValidatorFn(userChangePasswordValidator);
/** 组合验证器 */
const userChangeSecretValidator = z.object({
    oldSecret: z.string().min(8).max(64),
    newSecret: z.string().min(8).max(64),
});
export const userChangeSecretValidatorFn = createValidatorFn(userChangeSecretValidator);
/** 组合验证器 */
const noteAddValidator = z.object({
    title: z.string().min(0).max(300),
    content: z.string().min(1).max(15000),
    hidden: allValidators.hidden,
    pinned: allValidators.pinned,
});
export const noteAddValidatorFn = createValidatorFn(noteAddValidator);
/** 组合验证器 */
const noteUpdateValidator = z.object({
    uId: allValidators.uId,
    title: z.string().min(0).max(300).optional(),
    content: z.string().min(1).max(15000).optional(),
    hidden: allValidators.hidden.optional(),
    pinned: allValidators.pinned.optional(),
});
export const noteUpdateValidatorFn = createValidatorFn(noteUpdateValidator);