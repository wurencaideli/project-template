<script lang="ts">
import { defineComponent, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Select, ArrowRightBold, SemiSelect } from '@element-plus/icons-vue';
import { z } from 'zod';

import publicApi from '~/http/public.ts';
import userApi from '~/http/user.ts';
import { messageSuccess, messageError } from '~/action/message-prompt.ts';
import { throttleFn } from '~/common/debounce-and-throttle.ts';
import { userDataStore } from '~/store/user.ts';
import { toTrim, palindrome } from '~/common/string-tools.ts';
import { publicEncrypt } from '~/common/rsa-tools.ts';
import SvgIcon from '~/components/svg-icon.vue';
import img_2 from '~/assets/login-imgs/login-bg.svg';
import img_3 from '~/assets/login-imgs/code.svg';
import img_4 from '~/assets/login-imgs/login-bg-1.svg';
import img_5 from '~/assets/login-imgs/login-bg-2.svg';
import img_6 from '~/assets/login-imgs/login-bg-3.svg';
import img_7 from '~/assets/login-imgs/login-bg-4.png';

export default defineComponent({
    name: 'LoginView',
    components: {
        SvgIcon,
        Select,
        ArrowRightBold,
        SemiSelect,
    },
    setup() {
        const userData = userDataStore();
        const router = useRouter();
        const route = useRoute();
        const dataContainer: any = reactive({
            name: import.meta.env.VITE_APP_name,
            version: import.meta.env.VITE_VERSION,
            form: {
                name: '',
                password: '',
                captchaValue: '',
            },
            getCaptchaStatus: {
                loading: false,
                key: '',
                svg: '',
            },
            loginStatus: {
                loading: false,
            },
            img: {
                img_2,
                img_3,
                img_4,
                img_5,
                img_6,
                img_7,
            },
        });
        /** 验证信息 */
        const validSchema = z.object({
            name: z
                .string()
                .min(1, '账号不能为空')
                .max(70, '账号字符长度超出70')
                .regex(/^[A-Za-z0-9-_]+$/, '账号只能是英文，数字，下划线，中划线'),
            password: z.string().min(1, '密码不能为空').max(300, '密码字符长度超出300'),
            captchaValue: z.string().min(1, '验证码不能为空').max(7, '验证码字符长度超出7'),
        });
        function validBase(data: any) {
            const result = validSchema.safeParse(data);
            if (result.success) return;
            return result.error.issues[0].message;
        }
        /** 获取验证码 */
        const getCaptcha = throttleFn(function () {
            const getCaptchaStatus = {
                loading: true,
                key: '',
                svg: '',
            };
            dataContainer.getCaptchaStatus = getCaptchaStatus;
            publicApi
                .captcha()
                .then((res: any) => {
                    const data = res.data || {};
                    getCaptchaStatus.key = data.key;
                    getCaptchaStatus.svg = data.svg;
                    dataContainer.form.captchaValue = '';
                })
                .catch((res: any) => {
                    const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                    messageError(msg);
                })
                .finally(() => {
                    getCaptchaStatus.loading = false;
                    dataContainer.getCaptchaStatus = { ...dataContainer.getCaptchaStatus };
                });
        }, 700);
        getCaptcha();
        /** 登录操作 */
        const onLogin = throttleFn(async function (otherParams: any) {
            const verifiedData = validBase(dataContainer.form);
            if (verifiedData) {
                messageError(verifiedData);
                return;
            }
            const loginStatus = {
                loading: true,
            };
            dataContainer.loginStatus = loginStatus;
            const publicKey = await publicApi
                .rsaPublicKey()
                .then((res: any) => {
                    return res.data || '';
                })
                .catch(() => {
                    return '';
                });
            const params = Object.assign({}, dataContainer.form, otherParams);
            params.captchaKey = dataContainer.getCaptchaStatus.key;
            try {
                params.password = publicEncrypt(params.password, publicKey);
            } catch (error) {
                messageError(error);
                loginStatus.loading = false;
                dataContainer.loginStatus = { ...dataContainer.loginStatus };
                return;
            }
            userApi
                .login(params)
                .then(async (res: any) => {
                    const data = res.data || '';
                    dataContainer.form.password = '';
                    userData.setToken(data || '');
                    messageSuccess('登录成功');
                    /**
                     * 登录成功，跳转到首页
                     * 其他用户信息会在路由跳转是获取到
                     */
                    const routeParams = route.query || {};
                    if (routeParams.from) {
                        router.push(decodeURIComponent(routeParams.from as string));
                    } else {
                        router.push('/');
                    }
                })
                .catch((res: any) => {
                    const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                    messageError(msg);
                })
                .finally(() => {
                    loginStatus.loading = false;
                    dataContainer.loginStatus = { ...dataContainer.loginStatus };
                    getCaptcha();
                });
        }, 700);
        return {
            dataContainer,
            onLogin,
            getCaptcha,
            toTrim,
            palindrome,
        };
    },
});
</script>

<template>
    <div class="login-view">
        <div class="img-bg img-bg-1">
            <el-image class="img" :src="dataContainer.img.img_2" fit="cover" />
        </div>
        <div class="img-bg">
            <el-image class="img" :src="dataContainer.img.img_4" fit="contain" />
        </div>
        <div class="container">
            <div class="left">
                <el-carousel :interval="7000" arrow="never">
                    <el-carousel-item>
                        <div class="item">
                            <el-image class="img" :src="dataContainer.img.img_7" fit="contain" />
                            <div class="title">直接上手</div>
                            <div class="content">只用写好自己的业务页面</div>
                        </div>
                    </el-carousel-item>
                    <el-carousel-item>
                        <div class="item">
                            <el-image
                                class="img img-1"
                                :src="dataContainer.img.img_5"
                                fit="contain"
                            />
                            <div class="title">代码简单</div>
                            <div class="content">代码简洁易懂，遇到问题好解决</div>
                        </div>
                    </el-carousel-item>
                    <el-carousel-item>
                        <div class="item">
                            <el-image
                                class="img img-2"
                                :src="dataContainer.img.img_6"
                                fit="contain"
                            />
                            <div class="title">界面</div>
                            <div class="content">清新小巧，布局合理</div>
                        </div>
                    </el-carousel-item>
                </el-carousel>
            </div>
            <div class="right">
                <div class="container">
                    <div class="title">登 录</div>
                    <div class="other-login-bt">
                        <div class="item">
                            <SvgIcon
                                :style="'width:22px;height:22px;color:#fff;'"
                                name="img:gitee.svg"
                            ></SvgIcon>
                        </div>
                        <div class="item">
                            <SvgIcon
                                :style="'width:22px;height:22px;color:#00b9f3;'"
                                name="img:facebook-messenger.svg"
                            ></SvgIcon>
                        </div>
                        <div class="item">
                            <SvgIcon
                                :style="'width:22px;height:22px;color:#00c96e;'"
                                name="img:wechat.svg"
                            ></SvgIcon>
                        </div>
                    </div>
                    <div class="content-1">或使用您的账号</div>
                    <div class="input-container">
                        <SvgIcon
                            :style="'width:20px;height:20px;margin-right:10px;'"
                            name="svg:user-round.svg"
                        ></SvgIcon>
                        <el-input
                            clearable
                            @input="
                                () => {
                                    dataContainer.form.name = toTrim(dataContainer.form.name);
                                    dataContainer.form.name = palindrome(dataContainer.form.name);
                                }
                            "
                            placeholder="账号"
                            @keyup.enter="onLogin"
                            v-model="dataContainer.form.name"
                        />
                    </div>
                    <div class="input-container">
                        <SvgIcon
                            :style="'width:20px;height:20px;margin-right:10px;'"
                            name="svg:lock-keyhole.svg"
                        ></SvgIcon>
                        <el-input
                            type="password"
                            clearable
                            @keyup.enter="onLogin"
                            show-password
                            placeholder="密码"
                            @input="
                                () => {
                                    dataContainer.form.password = toTrim(
                                        dataContainer.form.password,
                                    );
                                }
                            "
                            v-model="dataContainer.form.password"
                        />
                    </div>
                    <div class="input-container code">
                        <SvgIcon
                            :style="'width:20px;height:20px;margin-right:10px;'"
                            name="svg:key-round.svg"
                        ></SvgIcon>
                        <el-input
                            v-model="dataContainer.form.captchaValue"
                            placeholder="验证码"
                            clearable
                            @keyup.enter="onLogin"
                        >
                        </el-input>
                        <div
                            @click="getCaptcha"
                            class="img"
                            v-html="dataContainer.getCaptchaStatus.svg"
                        ></div>
                    </div>
                    <div class="bt-list">
                        <el-button
                            class="login-bt"
                            v-if="!dataContainer.form.idU"
                            :loading="dataContainer.loginStatus.loading"
                            @click="onLogin"
                        >
                            登 录
                        </el-button>
                    </div>
                    <div class="other">
                        （没有后台接口，随便输入必填项就可以登录）
                        <!-- <router-link to="/register">
                            没有账号？去注册
                        </router-link> -->
                    </div>
                </div>
            </div>
        </div>
        <div class="bottom">
            版权所有 @admin.dumogu.top {{ dataContainer.name }} v-{{ dataContainer.version }}
            <a href="https://github.com/wurencaideli/dumogu-admin" target="_blank" class="bt">
                <SvgIcon :style="'width:60px;height:25px;'" name="img:github.svg"></SvgIcon>
            </a>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.login-view {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 15px;
    box-sizing: border-box;
    position: relative;
    > .img-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        pointer-events: none;
        display: flex;
        justify-content: center;
        align-items: center;
        > .img {
            width: 95%;
            height: 95%;
        }
        &.img-bg-1 {
            > .img {
                width: 100%;
                height: 100%;
            }
        }
    }
    > .container {
        position: relative;
        z-index: 2;
        display: flex;
        flex-direction: row;
        width: 100%;
        max-width: 900px;
        background-color: rgb(56, 56, 56);
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 4px 4px 5px 0 rgba(0, 0, 0, 0.449);
        > .left {
            flex: 1 1 0;
            width: 0;
            background-color: #c6c6c6;
            :deep(.el-carousel) {
                width: 100%;
                height: 100%;
                .el-carousel__container {
                    width: 100%;
                    height: 100%;
                    .item {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        position: relative;
                        > .img {
                            width: 100%;
                            max-width: 200px;
                            height: 100%;
                            max-height: 200px;
                            transform: scale(1.5) translateY(-40px);
                            &.img-1 {
                                transform: scale(1.7) translateY(-15px) translateX(-10px);
                            }
                            &.img-2 {
                                transform: scale(1.5) translateY(-30px);
                            }
                        }
                        > .title {
                            font-size: 20px;
                            color: #000000;
                            margin: 10px 0 0 0;
                            font-weight: bold;
                            position: absolute;
                            bottom: 80px;
                        }
                        > .content {
                            font-size: 15px;
                            color: #000000;
                            opacity: 0.7;
                            margin-top: 15px;
                            position: absolute;
                            bottom: 50px;
                        }
                    }
                }
                .el-carousel__indicators {
                    bottom: 10px;
                    --el-carousel-indicator-width: 40px;
                    --el-carousel-indicator-height: 7px;
                    .is-active {
                        .el-carousel__button {
                            width: 60px;
                            opacity: 1;
                        }
                    }
                    .el-carousel__button {
                        border-radius: 3px;
                        box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.204);
                        background-color: #0059b2;
                        background: linear-gradient(to right, #007fff, #0059b2);
                        opacity: 0.3;
                    }
                }
            }
        }
        > .right {
            flex: 1 1 0;
            width: 0;
            > .container {
                width: 100%;
                height: 100%;
                padding: 20px 30px;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                align-items: center;
                > .title {
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    font-size: 25px;
                    font-weight: bold;
                    background: -webkit-linear-gradient(120deg, #007fff 30%, #ededed);
                    -webkit-background-clip: text;
                    background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                > .other-login-bt {
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    justify-content: center;
                    margin: 15px 0;
                    > .item {
                        border: 1px solid #ddd;
                        border-radius: 50%;
                        display: inline-flex;
                        justify-content: center;
                        align-items: center;
                        margin: 0 10px;
                        height: 40px;
                        width: 40px;
                        cursor: pointer;
                        box-shadow: inset 0 1px 4px #0000001f;
                    }
                }
                > .content-1 {
                    font-size: 13px;
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    opacity: 0.8;
                }
                > .input-container {
                    width: 100%;
                    max-width: 300px;
                    display: flex;
                    justify-content: flex-start;
                    align-items: center;
                    background: #eee;
                    color: #000;
                    border: none;
                    padding: 0 15px;
                    margin: 20px 0 0 0;
                    border-radius: 5px;
                    height: 45px;
                    box-sizing: border-box;
                    transition: all 0.2s;
                    box-shadow: inset 0 1px 4px #0000001f;
                    &:focus-within {
                        box-shadow:
                            inset 0 1px 4px #0000001f,
                            0 0 0 2px #007fff !important;
                    }
                    :deep(.el-input) {
                        flex: 1 1 0;
                        width: 0;
                        border: none;
                        box-shadow: none;
                        outline: none;
                        background-color: transparent;
                        .el-input__wrapper {
                            border: none;
                            box-shadow: none;
                            outline: none;
                            background-color: transparent;
                            padding: 0;
                            input {
                                font-size: 16px;
                                color: #000;
                            }
                        }
                        .el-input__suffix {
                            .el-icon {
                                font-size: 20px !important;
                                color: #3c3c3c !important;
                            }
                        }
                    }
                    &.code {
                        padding: 0 5px 0 15px;
                    }
                    > .img {
                        width: 100px;
                        height: calc(100% - 10px);
                        margin-left: 15px;
                        cursor: pointer;
                        border-radius: 5px;
                        border: 1px solid rgba(0, 0, 0, 0.156);
                        overflow: hidden;
                        :deep(svg) {
                            width: 100%;
                            height: 100%;
                        }
                    }
                }
                > .bt-list {
                    display: flex;
                    flex-direction: row;
                    justify-content: center;
                    margin: 20px 0;
                    :deep(.login-bt) {
                        border-radius: 999px;
                        border: none;
                        background: #007fff;
                        color: #fff;
                        font-size: 14px;
                        font-weight: bold;
                        padding: 12px 60px;
                        letter-spacing: 1px;
                        height: 45px;
                        background: linear-gradient(to right, #007fff, #0059b2);
                        box-shadow:
                            0 3px 3px -2px #0003,
                            0 3px 4px #00000024,
                            0 1px 8px #0000001f;
                    }
                }
                > .other {
                    font-size: 14px;
                    opacity: 0.5;
                    margin-top: 0;
                }
            }
        }
    }
    > .bottom {
        position: fixed;
        bottom: 15px;
        width: 100%;
        height: fit-content;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 13px;
        color: white;
        z-index: 999;
        > * {
            margin: 0 15px;
        }
    }
}
</style>
