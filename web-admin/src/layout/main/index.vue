<script lang="ts">
import { defineComponent, reactive, toRef, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

import Navbar from './components/navbar.vue';
import Menu from './components/menu.vue';
import TagList from './components/tag-list.vue';

import { userDataStore } from '~/store/user.ts';
import { tagDataStore } from '~/store/tag.ts';
import { setTagList } from '~/store/tag-manage.ts';
import { findPermissionConfigByRoutePath } from '~/store/user-manage.ts';
import img_1 from '~/assets/logo.png';
import KeepAliveRouter from '~/components/keep-alive-router.vue';
import DefineScrollbar from '~/components/define-scrollbar.vue';

export default defineComponent({
    name: 'MainLayout',
    components: {
        Menu,
        TagList,
        KeepAliveRouter,
        Navbar,
        DefineScrollbar,
    },
    props: {},
    setup() {
        const userData = userDataStore();
        const tagData = tagDataStore();
        const router = useRouter();
        const route = useRoute();
        const dataContainer: any = reactive({
            name: import.meta.env.VITE_APP_name,
            img: {
                img_1,
            },
            layoutGroupSign: computed(
                () => findPermissionConfigByRoutePath(route.path)?.layoutGroupSign || '',
            ),
            userInfo: toRef(userData, 'info'),
            tagList: computed(() => tagData.tagMap[dataContainer.layoutGroupSign]?.tagList || []),
            menuTree: toRef(userData, 'menuTree'),
            iframeList: toRef(userData, 'iframeList'),
        });
        /**
         * iframe list map
         */
        const iframePathMap = computed(() => {
            return dataContainer.iframeList
                .filter((item: any) => {
                    return item.layoutGroupSign == dataContainer.layoutGroupSign;
                })
                .reduce((c: any, i: any) => {
                    c[i.path] = i;
                    return c;
                }, {} as any);
        });
        /**
         * 需要缓存的页面列表
         */
        const cacheTagList = computed(() => {
            return dataContainer.tagList
                .filter((item: any) => {
                    return (
                        item.layoutGroupSign == dataContainer.layoutGroupSign &&
                        item.isCache &&
                        item.hasTag
                    );
                })
                .map((item: any) => {
                    return item.routePath;
                });
        });
        function toPath(path: any) {
            router.push(path);
        }
        /** 标签列表修改（拖拽排序），由外部写回 */
        function handleTagListChange(value: any) {
            setTagList(dataContainer.layoutGroupSign, value);
        }
        return {
            dataContainer,
            routeInstance: route,
            toPath,
            cacheTagList,
            iframePathMap,
            handleTagListChange,
        };
    },
});
</script>

<template>
    <div
        :class="{
            'main-layout': true,
        }"
    >
        <div class="left">
            <Navbar :userInfo="dataContainer.userInfo"></Navbar>
        </div>
        <div class="centre">
            <div class="logo" @click="toPath({ path: '/' })">
                <el-image class="img" :src="dataContainer.img.img_1" fit="cover" />
                <div class="name">{{ dataContainer.name }}</div>
            </div>
            <div class="main-centre-content">
                <DefineScrollbar height="100%" :showUpBt="false">
                    <div class="main-centre-content-container">
                        <Menu :menuTree="dataContainer.menuTree"></Menu>
                    </div>
                </DefineScrollbar>
            </div>
        </div>
        <div class="right">
            <div class="top">
                <TagList
                    :activePath="routeInstance.path"
                    :layoutGroupSign="dataContainer.layoutGroupSign"
                    :tagList="dataContainer.tagList"
                    @onChange="handleTagListChange"
                ></TagList>
            </div>
            <div class="view-container">
                <KeepAliveRouter :cacheList="cacheTagList"></KeepAliveRouter>
                <!-- 当前打开的iframe列表页，防止重新刷新 -->
                <div
                    :style="{
                        'z-index': iframePathMap[routeInstance.path] ? 1 : -1,
                        opacity: iframePathMap[routeInstance.path] ? 1 : 0,
                    }"
                    class="iframe-view"
                >
                    <iframe
                        v-for="item in dataContainer.iframeList.filter((item: any) => {
                            return item.layoutGroupSign == dataContainer.layoutGroupSign;
                        })"
                        :key="item.key"
                        :style="{
                            'z-index': item.path == routeInstance.path ? 1 : -1,
                            opacity: item.path == routeInstance.path ? 1 : 0,
                        }"
                        :src="item.src"
                        width="100%"
                        height="100%"
                        frameborder="0"
                        allowfullscreen
                    >
                    </iframe>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.main-layout {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    font-size: 16px;
    display: flex;
    flex-direction: row;
    position: relative;
    z-index: 9;
    > .left {
        height: 100%;
        background-color: var(--bg-color);
        transition:
            width 0.2s,
            opacity 0.2s;
        width: fit-content;
    }
    > .centre {
        height: 100%;
        width: var(--menu-width);
        background-color: var(--bg-color-2);
        display: flex;
        flex-direction: column;
        transition:
            width 0.2s,
            opacity 0.2s;
        > .logo {
            height: var(--navbar-height);
            padding: 0 10px;
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
            // color:#444954;
            color: #f0f0f0;
            transition: all 0.2s;
            overflow: hidden;
            box-shadow: var(--box-shadow-2);
            border-bottom: 1px solid rgba(0, 0, 0, 0.47);
            cursor: pointer;
            &.hidden {
                width: 0;
                padding: 0;
                // display: none;
                pointer-events: none;
                > .name {
                    font-size: 0;
                }
            }
            > .img {
                // flex:1 1 0;
                width: 45px;
                height: 45px;
                border-radius: 5px;
                margin-right: 10px;
            }
            > .name {
                width: max-content;
                font-size: 22px;
                font-weight: bold;
                transition: all 0.2s;
            }
        }
        > .main-centre-content {
            height: 0;
            flex: 1 1 0;
        }
    }
    > .right {
        height: 100%;
        background-color: var(--bg-color-3);
        background-image: linear-gradient(to right, var(--bg-color-3) 0%, var(--bg-color-2) 100%);
        flex: 1 1 0;
        width: 0;
        display: flex;
        flex-direction: column;
        position: relative;
        z-index: 8;
        overflow: hidden;
        > .top {
            height: var(--navbar-height);
            width: 100%;
            // border-bottom: 1px solid rgb(218, 218, 218);
            box-sizing: border-box;
            box-shadow: 0 0 5px #242425;
            position: relative;
            z-index: 2;
            box-shadow: var(--box-shadow-2);
            border-bottom: 1px solid rgba(0, 0, 0, 0.47);
        }
        > .view-container {
            flex: 1 1 0;
            height: 0;
            width: 100%;
            overflow: hidden;
            position: relative;
            z-index: 1;
            > .iframe-view {
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0;
                left: 0;
                z-index: 1;
                > iframe {
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: -1;
                }
            }
            > .option-bt-list {
                position: absolute;
                top: 5px;
                left: 0;
                width: 100%;
                opacity: 0;
                pointer-events: none;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: all 0.2s;
                z-index: 999;
                &.show {
                    opacity: 1;
                    pointer-events: initial;
                }
                > .container {
                    width: auto;
                    border-radius: 3px;
                    background-color: rgb(255, 255, 255);
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    padding: 5px;
                    box-sizing: border-box;
                    box-shadow: rgba(0, 0, 0, 0.476) 0px 1px 3px;
                    > * {
                        margin-right: 5px;
                        cursor: pointer;
                        border-radius: 3px;
                        box-shadow: inset 0 1px 4px #0000001f;
                        padding: 7px;
                        color: #444954;
                        &:last-child {
                            margin: 0;
                        }
                    }
                }
            }
        }
    }
    > .head-container {
        width: 100%;
        height: var(--navbar-height);
        // border-bottom: 1px solid rgb(218, 218, 218);
        box-sizing: border-box;
        position: relative;
        z-index: 10;
        display: flex;
        flex-direction: row;
        box-shadow: var(--box-shadow-2);
        > .left {
            width: var(--menu-width);
            height: 100%;
            padding: 0 10px;
            box-sizing: border-box;
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
            background-color: var(--bg-color-2);
            // color:#444954;
            color: #f0f0f0;
            transition: all 0.2s;
            overflow: hidden;
            &.hidden {
                width: 0;
                padding: 0;
                // display: none;
                pointer-events: none;
                > .name {
                    font-size: 0;
                }
            }
            > .logo {
                // flex:1 1 0;
                width: 45px;
                height: 45px;
                border-radius: 5px;
                cursor: pointer;
                margin-right: 10px;
            }
            > .name {
                width: max-content;
                font-size: 22px;
                font-weight: bold;
                transition: all 0.2s;
            }
        }
        > .right {
            flex: 1 1 0;
            width: 0;
            height: 100%;
            box-sizing: border-box;
            background-color: var(--bg-color-3);
        }
    }
    > .content-container {
        flex: 1 1 0;
        height: 0;
        width: 100%;
        display: flex;
        flex-direction: row;
        position: relative;
        z-index: 8;
        > .left {
            width: var(--menu-width);
            height: 100%;
            overflow-y: auto;
            // border-right: 1px solid rgb(218, 218, 218);
            box-sizing: border-box;
            position: relative;
            z-index: 9;
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.177);
            background-color: var(--bg-color-2);
            transition: width 0.2s;
            overflow: hidden;
            &.hidden {
                width: 0;
                // display: none;
                pointer-events: none;
            }
        }
        > .right {
            flex: 1 1 0;
            width: 0;
            display: flex;
            flex-direction: column;
            position: relative;
            z-index: 8;
            overflow: hidden;
            background-color: var(--bg-color-3);
            > .top {
                height: var(--tags-height);
                width: 100%;
                // border-bottom: 1px solid rgb(218, 218, 218);
                box-sizing: border-box;
                box-shadow: 0 0 5px #242425;
                position: relative;
                z-index: 2;
            }
            > .view-container {
                flex: 1 1 0;
                height: 0;
                width: 100%;
                overflow: hidden;
                position: relative;
                z-index: 1;
                > .iframe-view {
                    width: 100%;
                    height: 100%;
                    position: absolute;
                    top: 0;
                    left: 0;
                    z-index: 1;
                    > iframe {
                        position: absolute;
                        top: 0;
                        left: 0;
                        z-index: -1;
                    }
                }
                > .option-bt-list {
                    position: absolute;
                    top: 5px;
                    left: 0;
                    width: 100%;
                    opacity: 0;
                    pointer-events: none;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    transition: all 0.2s;
                    z-index: 999;
                    &.show {
                        opacity: 1;
                        pointer-events: initial;
                    }
                    > .container {
                        width: auto;
                        border-radius: 3px;
                        background-color: rgb(255, 255, 255);
                        display: flex;
                        flex-direction: row;
                        align-items: center;
                        padding: 5px;
                        box-sizing: border-box;
                        box-shadow: rgba(0, 0, 0, 0.476) 0px 1px 3px;
                        > * {
                            margin-right: 5px;
                            cursor: pointer;
                            border-radius: 3px;
                            box-shadow: inset 0 1px 4px #0000001f;
                            padding: 7px;
                            color: #444954;
                            &:last-child {
                                margin: 0;
                            }
                        }
                    }
                }
            }
        }
    }
}
</style>
