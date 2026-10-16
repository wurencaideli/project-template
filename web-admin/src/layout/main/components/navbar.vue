<script lang="ts">
import { defineComponent, ref, reactive, toRef, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import SvgIcon from '~/components/svg-icon.vue';
import UserAvatar from '~/components/user-avatar.vue';
import { userDataStore } from '~/store/user.ts';
import { clearAllTags } from '~/store/tag-manage.ts';
import { messageSuccess, messageError, confirm } from '~/action/message-prompt.ts';
import { createDropdownMenu } from '~/action/dropdown-menu-modal-service.ts';
import DropdownMenuModal from '~/components/dropdown-menu-modal.vue';
import userApi from '~/http/user.ts';

export default defineComponent({
    name: 'Navbar',
    components: {
        SvgIcon,
        UserAvatar,
    },
    props: {
        /** 用户信息 */
        userInfo: {
            type: Object,
            default: () => {
                return {};
            },
        },
    },
    setup(props) {
        const userData = userDataStore();
        const router = useRouter();
        const dataContainer: any = reactive({
            loading: false,
            userInfo: toRef(props, 'userInfo'),
        });
        const otherDataContainer: any = {
            menu: null,
            menuTarget: null,
        };
        const nickNameChars = computed(() => {
            return (dataContainer.userInfo.nickname || '').split('');
        });
        const MenuBtRef = ref<any>(null);
        /** 跳转页面 */
        function toPath(path: any) {
            router.push(path);
        }
        /** 退出登录 */
        async function handleLogout() {
            const state = await confirm('退出登录？', '确定退出？', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
                showClose: false,
            })
                .then(() => {
                    return true;
                })
                .catch(() => {
                    return false;
                });
            if (!state) return;
            userApi
                .logout()
                .then(() => {
                    userData.setUserInfo({});
                    userData.setToken('');
                    clearAllTags();
                    router.push('/login');
                })
                .catch((res: any) => {
                    const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                    messageError('退出失败：' + msg);
                });
        }
        async function handleLogoutAll() {
            const state = await confirm('退出登录(所有设备)？', '确定退出？', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning',
                showClose: false,
            })
                .then(() => {
                    return true;
                })
                .catch(() => {
                    return false;
                });
            if (!state) return;
            userApi
                .logout({ exitAll: true })
                .then(() => {
                    userData.setUserInfo({});
                    userData.setToken('');
                    clearAllTags();
                    router.push('/login');
                })
                .catch((res: any) => {
                    const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                    messageError(msg);
                });
        }
        function closeMenu() {
            const menu = otherDataContainer.menu;
            if (menu) menu.show = false;
        }
        function handleDocPointerdown(e: any) {
            const menu = otherDataContainer.menu;
            if (!menu || !menu.show) return;
            const el = e.target as HTMLElement;
            if (
                menu.dropdownMenuContainerEl.contains(el) ||
                otherDataContainer.menuTarget?.contains(el)
            )
                return;
            closeMenu();
        }
        /** 点击齿轮图标弹出下拉菜单，实例只创建一次，之后通过 show 开关 */
        function handleShowMenu() {
            const menu = otherDataContainer.menu;
            if (menu) {
                menu.show = !menu.show;
                return;
            }
            const target = MenuBtRef.value.$el;
            otherDataContainer.menuTarget = target;
            otherDataContainer.menu = createDropdownMenu({
                target,
                show: true,
                displayAreaLimit: 'vertical',
                offset: 5,
                component: DropdownMenuModal,
                props: {
                    list: [
                        {
                            label: '修改用户基本信息',
                            iconName: 'svg:user.svg',
                            onClick: () => {
                                closeMenu();
                                toPath('/main/mine/info-update');
                            },
                        },
                        {
                            label: '修改用户密码',
                            iconName: 'svg:key-round.svg',
                            onClick: () => {
                                closeMenu();
                                toPath('/main/mine/info-password');
                            },
                        },
                        {
                            label: '退出登录',
                            iconName: 'svg:power.svg',
                            logout: true,
                            onClick: () => {
                                closeMenu();
                                handleLogout();
                            },
                        },
                        {
                            label: '退出登录(所有设备)',
                            iconName: 'svg:power.svg',
                            logout: true,
                            onClick: () => {
                                closeMenu();
                                handleLogoutAll();
                            },
                        },
                    ],
                },
            });
        }
        onMounted(() => document.addEventListener('pointerdown', handleDocPointerdown, true));
        onUnmounted(() => {
            document.removeEventListener('pointerdown', handleDocPointerdown, true);
            otherDataContainer.menu?.destroy();
        });
        return {
            dataContainer,
            nickNameChars,
            MenuBtRef,
            toPath,
            handleLogout,
            handleLogoutAll,
            handleShowMenu,
        };
    },
});
</script>

<template>
    <div class="navbar-cp">
        <div class="top">
            <div class="user-container">
                <div @click="toPath('/main/mine/info')" class="user">
                    <UserAvatar
                        :src="dataContainer.userInfo.avatar"
                        :name="dataContainer.userInfo.nickname || dataContainer.userInfo.name"
                    ></UserAvatar>
                </div>
                <div class="name">
                    <SvgIcon
                        :style="'width: 20px;min-width:20px;height: 20px;'"
                        :name="'svg:user.svg'"
                    ></SvgIcon>
                    <span v-for="(char, index) in nickNameChars" :key="index">
                        {{ char }}
                    </span>
                </div>
            </div>
            <SvgIcon
                ref="MenuBtRef"
                :style="'width: 22px;min-width:22px;height: 22px;cursor: pointer;'"
                :name="'svg:settings.svg'"
                @click="handleShowMenu"
            ></SvgIcon>
            <a href="https://gitee.com/wuzhanggui/dumogu-admin" target="_blank" class="bt">
                <SvgIcon :style="'width:22px;height:22px;'" name="img:gitee.svg"></SvgIcon>
            </a>
            <a href="https://github.com/wurencaideli/dumogu-admin" target="_blank" class="bt">
                <SvgIcon :style="'width:22px;height:22px;'" name="img:github.svg"></SvgIcon>
            </a>
            <a href="https://txc.qq.com/products/613546" target="_blank" class="bt">
                <SvgIcon :style="'width:22px;height:22px;'" name="svg:megaphone.svg"></SvgIcon>
                <div class="number">
                    <div class="container">12</div>
                </div>
            </a>
        </div>
        <div class="bottom">
            <div class="index" @click="handleLogout">
                <SvgIcon
                    :style="'width: 20px;min-width:20px;height: 20px;margin-right:0px;color: #f92b4c;'"
                    :name="'svg:power.svg'"
                ></SvgIcon>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.navbar-cp {
    width: fit-content;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    --text-color: #94abbe;
    > .top {
        box-sizing: border-box;
        padding: 10px 10px;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        color: var(--text-color);
        gap: 30px;
        > .user-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 30px;
            > .user {
                height: 40px;
                width: 40px;
                border-radius: 50%;
                border: 1px solid var(--text-color);
                box-sizing: border-box;
                background-color: #1f364d;
                cursor: pointer;
                box-shadow: var(--bt-box-shadow-1);
            }
            > .name {
                font-size: 13px;
                font-weight: bold;
                width: fit-content;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
                span {
                    line-height: 1;
                    font-size: 15px;
                    font-weight: bold;
                    text-shadow: 1px 1px 0px #000;
                }
            }
        }
        > .bt {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            border-radius: 999px;
            box-sizing: border-box;
            transition: all 0.2s;
            position: relative;
            &:hover {
                background-color: #000000af;
                transform: scale(1.2);
            }
            > .number {
                height: fit-content;
                width: auto;
                position: absolute;
                display: flex;
                flex-direction: row;
                justify-content: center;
                align-items: center;
                top: -10px;
                right: -10px;
                pointer-events: none;
                > .container {
                    transform: scale(0.8) translateY(3px);
                    font-size: 12px;
                    background-color: #fef0f0;
                    color: #f56c6c;
                    border-radius: 5px;
                    padding: 0px 3px;
                    line-height: 1.2;
                    border: 1px solid #fab6b6;
                    font-weight: bold;
                }
            }
        }
    }
    > .bottom {
        padding: 10px 0;
        color: var(--text-color);
        > .index {
            font-size: 13px;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            font-weight: bold;
        }
    }
}
</style>
