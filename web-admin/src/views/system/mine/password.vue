<script lang="ts">
import { defineComponent, ref, reactive } from 'vue';
import { z } from 'zod';

import SvgIcon from '~/components/svg-icon.vue';
import { messageError, messageSuccess, confirm } from '~/action/message-prompt.ts';
import { toTrim } from '~/common/common-tools.ts';
import { throttleFn } from '~/common/debounce-and-throttle.ts';
import userApi from '~/http/user.ts';
import publicApi from '~/http/public.ts';
import { userDataStore } from '~/store/user.ts';
import { publicEncrypt } from '~/common/rsa-tools.ts';

export default defineComponent({
    components: {
        SvgIcon,
    },
    setup() {
        const userData = userDataStore();
        const FormElRef = ref<any>(null);
        const FormElRef_1 = ref<any>(null);
        const dataContainer: any = reactive({
            loading: false,
            form: {},
            rules: {
                password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
                signPassword: [{ required: true, message: '请输入密匙', trigger: 'blur' }],
                newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
                password_: [
                    { required: true, message: '请确认新密码', trigger: 'blur' },
                    {
                        validator: (rule: any, value: any, callBack: any) => {
                            if (value !== dataContainer.form.newPassword) {
                                callBack(new Error('两次密码不一致'));
                            }
                            callBack();
                        },
                        trigger: 'blur',
                    },
                ],
            },
            loading_1: false,
            form_1: {},
            rules_1: {
                password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
                signPassword: [{ required: true, message: '请输入密匙', trigger: 'blur' }],
                newSignPassword: [{ required: true, message: '请输入新密匙', trigger: 'blur' }],
                password_: [
                    { required: true, message: '请确认新秘钥', trigger: 'blur' },
                    {
                        validator: (rule: any, value: any, callBack: any) => {
                            if (value !== dataContainer.form_1.newSignPassword) {
                                callBack(new Error('两次秘钥不一致'));
                            }
                            callBack();
                        },
                        trigger: 'blur',
                    },
                ],
            },
        });
        /** 提交数据 */
        const handleSubmit = throttleFn(function () {
            if (!FormElRef.value || dataContainer.loading) return;
            FormElRef.value.validate((valid: any, e: any) => {
                if (!valid) {
                    const message = e[Object.keys(e)[0]][0].message;
                    messageError(message);
                    return;
                }
                const verifiedData = validBase(dataContainer.form);
                if (verifiedData) {
                    messageError(verifiedData);
                    return;
                }
                confirm('确认提交数据', '提示！')
                    .then(async () => {
                        dataContainer.loading = true;
                        const publicKey = await publicApi
                            .rsaPublicKey()
                            .then((res: any) => {
                                return res.data || '';
                            })
                            .catch(() => {
                                return '';
                            });
                        const params = Object.assign({}, dataContainer.form);
                        delete params.password_;
                        try {
                            params.password = publicEncrypt(params.password, publicKey);
                            params.signPassword = publicEncrypt(params.signPassword, publicKey);
                            params.newPassword = publicEncrypt(params.newPassword, publicKey);
                        } catch (error) {
                            messageError(error);
                            dataContainer.loading = false;
                            return;
                        }
                        userApi
                            .updatePassword(params)
                            .then((res: any) => {
                                messageSuccess('修改成功');
                                const data = res.data || '';
                                userData.setUserInfo(
                                    Object.assign({}, userData.info, {
                                        token: data,
                                    }),
                                );
                                delete dataContainer.form.password;
                                delete dataContainer.form.signPassword;
                                delete dataContainer.form.newPassword;
                                delete dataContainer.form.password_;
                            })
                            .catch((res: any) => {
                                const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                                messageError(msg);
                            })
                            .finally(() => {
                                dataContainer.loading = false;
                            });
                    })
                    .catch(() => {});
            });
        }, 700);
        /**
         * 数据验证
         * 外部可调用
         */
        const validBaseSchema = z.object({
            newPassword: z
                .string()
                .min(1, '新密码不能为空')
                .max(300, '新密码字符长度超出300'),
            password: z.string().min(1, '密码不能为空').max(300, '密码字符长度超出300'),
            signPassword: z.string().min(1, '密匙不能为空').max(300, '密匙字符长度超出300'),
        });
        function validBase(data: any) {
            const result = validBaseSchema.safeParse(data);
            if (result.success) return;
            return result.error.issues[0].message;
        }
        /** 提交数据 */
        const handleSubmit_1 = throttleFn(function () {
            if (!FormElRef_1.value || dataContainer.loading_1) return;
            FormElRef_1.value.validate((valid: any, e: any) => {
                if (!valid) {
                    const message = e[Object.keys(e)[0]][0].message;
                    messageError(message);
                    return;
                }
                const verifiedData = validBase_1(dataContainer.form_1);
                if (verifiedData) {
                    messageError(verifiedData);
                    return;
                }
                confirm('确认提交数据', '提示！')
                    .then(async () => {
                        dataContainer.loading_1 = true;
                        const publicKey = await publicApi
                            .rsaPublicKey()
                            .then((res: any) => {
                                return res.data || '';
                            })
                            .catch(() => {
                                return '';
                            });
                        const params = Object.assign({}, dataContainer.form_1);
                        delete params.password_;
                        try {
                            params.password = publicEncrypt(params.password, publicKey);
                            params.signPassword = publicEncrypt(params.signPassword, publicKey);
                            params.newSignPassword = publicEncrypt(
                                params.newSignPassword,
                                publicKey,
                            );
                        } catch (error) {
                            messageError(error);
                            dataContainer.loading_1 = false;
                            return;
                        }
                        userApi
                            .updateSignPassword(params)
                            .then((res: any) => {
                                messageSuccess('修改成功');
                                const data = res.data || '';
                                userData.setUserInfo(
                                    Object.assign({}, userData.info, {
                                        token: data,
                                    }),
                                );
                                delete dataContainer.form.password;
                                delete dataContainer.form.signPassword;
                                delete dataContainer.form.newSignPassword;
                                delete dataContainer.form.password_;
                            })
                            .catch((res: any) => {
                                const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                                messageError(msg);
                            })
                            .finally(() => {
                                dataContainer.loading_1 = false;
                            });
                    })
                    .catch(() => {});
            });
        }, 700);
        /**
         * 数据验证
         * 外部可调用
         */
        const validBaseSchema_1 = z.object({
            newSignPassword: z
                .string()
                .min(1, '新密匙不能为空')
                .max(300, '新密匙字符长度超出300'),
            password: z.string().min(1, '密码不能为空').max(300, '密码字符长度超出300'),
            signPassword: z.string().min(1, '密匙不能为空').max(300, '密匙字符长度超出300'),
        });
        function validBase_1(data: any) {
            const result = validBaseSchema_1.safeParse(data);
            if (result.success) return;
            return result.error.issues[0].message;
        }
        return {
            dataContainer,
            FormElRef,
            handleSubmit,
            FormElRef_1,
            handleSubmit_1,
            toTrim,
        };
    },
});
</script>

<template>
    <div class="page-container mine-password-view">
        <div class="container">
            <div class="title">修改密码（需要密码秘钥验证）</div>
            <div class="form">
                <el-form
                    :model="dataContainer.form"
                    ref="FormElRef"
                    :inline="false"
                    :rules="dataContainer.rules"
                    label-width="120px"
                    style="width: 100%"
                >
                    <el-row :gutter="0">
                        <el-col :span="12">
                            <el-form-item label="密码" prop="password">
                                <el-input
                                    show-password
                                    @input="
                                        () => {
                                            dataContainer.form.password = toTrim(
                                                dataContainer.form.password,
                                            );
                                        }
                                    "
                                    :clearable="true"
                                    v-model="dataContainer.form.password"
                                >
                                </el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="密匙" prop="signPassword">
                                <el-input
                                    show-password
                                    @input="
                                        () => {
                                            dataContainer.form.signPassword = toTrim(
                                                dataContainer.form.signPassword,
                                            );
                                        }
                                    "
                                    :clearable="true"
                                    v-model="dataContainer.form.signPassword"
                                >
                                </el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item label="新密码" prop="newPassword">
                                <el-input
                                    show-password
                                    @input="
                                        () => {
                                            dataContainer.form.newPassword = toTrim(
                                                dataContainer.form.newPassword,
                                            );
                                        }
                                    "
                                    :clearable="true"
                                    v-model="dataContainer.form.newPassword"
                                >
                                </el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item label="确认新密码" prop="password_">
                                <el-input
                                    show-password
                                    @input="
                                        () => {
                                            dataContainer.form.password_ = toTrim(
                                                dataContainer.form.password_,
                                            );
                                        }
                                    "
                                    v-model="dataContainer.form.password_"
                                    :clearable="true"
                                >
                                </el-input>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
                <el-button :loading="dataContainer.loading" type="primary" @click="handleSubmit">
                    提交
                </el-button>
            </div>
            <div class="title">修改密匙（需要密码秘钥验证）</div>
            <div class="form">
                <el-form
                    :model="dataContainer.form_1"
                    ref="FormElRef_1"
                    :inline="false"
                    :rules="dataContainer.rules_1"
                    label-width="120px"
                    style="width: 100%"
                >
                    <el-row :gutter="0">
                        <el-col :span="12">
                            <el-form-item label="密码" prop="password">
                                <el-input
                                    show-password
                                    @input="
                                        () => {
                                            dataContainer.form_1.password = toTrim(
                                                dataContainer.form_1.password,
                                            );
                                        }
                                    "
                                    :clearable="true"
                                    v-model="dataContainer.form_1.password"
                                >
                                </el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12">
                            <el-form-item label="密匙" prop="signPassword">
                                <el-input
                                    show-password
                                    @input="
                                        () => {
                                            dataContainer.form_1.signPassword = toTrim(
                                                dataContainer.form_1.signPassword,
                                            );
                                        }
                                    "
                                    :clearable="true"
                                    v-model="dataContainer.form_1.signPassword"
                                >
                                </el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item label="新密匙" prop="newSignPassword">
                                <el-input
                                    show-password
                                    @input="
                                        () => {
                                            dataContainer.form_1.newSignPassword = toTrim(
                                                dataContainer.form_1.newSignPassword,
                                            );
                                        }
                                    "
                                    :clearable="true"
                                    v-model="dataContainer.form_1.newSignPassword"
                                >
                                </el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item label="确认新秘钥" prop="password_">
                                <el-input
                                    show-password
                                    @input="
                                        () => {
                                            dataContainer.form_1.password_ = toTrim(
                                                dataContainer.form_1.password_,
                                            );
                                        }
                                    "
                                    v-model="dataContainer.form_1.password_"
                                    :clearable="true"
                                >
                                </el-input>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
                <el-button
                    :loading="dataContainer.loading_1"
                    type="primary"
                    @click="handleSubmit_1"
                >
                    提交
                </el-button>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.mine-password-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 15px;
    box-sizing: border-box;
    > .container {
        width: 100%;
        max-width: 900px;
        padding: 60px 15px;
        box-sizing: border-box;
        background-color: var(--bg-color);
        border-radius: 12px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        flex-direction: column;
        > * {
            margin-bottom: 30px;
            &:last-child {
                margin: 0;
            }
        }
        > .title {
            font-size: 17px;
            font-weight: bold;
        }
        > .form {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
    }
}
</style>
