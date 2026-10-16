<script lang="ts">
import { defineComponent, reactive } from 'vue';
import { useRoute } from 'vue-router';

import SvgIcon from '~/components/svg-icon.vue';
import { messageError, messageSuccess, confirm } from '~/action/message-prompt.ts';
import publicApi from '~/http/public.ts';
import DefineScrollbar from '~/components/define-scrollbar.vue';

export default defineComponent({
    components: {
        SvgIcon,
    },
    setup() {
        const route = useRoute();
        const dataContainer: any = reactive({
            isShow: false,
            loading: false,
            loading_1: false,
            loading_2: false,
            loading_3: false,
            loading_4: false,
            loading_5: false,
            loading_6: false,
            loading_7: false,
        });
        /**
         * 数据初始化
         */
        function initData() {
            const params = route.params;
            if (!params.sign) return;
            const query = route.query || {};
            dataContainer.isShow = query.isShow === 'true';
        }
        initData();
        /** 更新rss文件 */
        function handleUpdateRss() {
            confirm('确认更新rss文件', '提示！')
                .then(() => {
                    dataContainer.loading = true;
                    publicApi
                        .rssUpdate()
                        .then(() => {
                            messageSuccess('更新成功');
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
        }
        /** 更新sitemap文件 */
        function handleUpdateSitemap() {
            confirm('确认更新sitemap文件', '提示！')
                .then(() => {
                    dataContainer.loading_1 = true;
                    publicApi
                        .sitemapUpdate()
                        .then(() => {
                            messageSuccess('更新成功');
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
        }
        function handleInitData() {
            confirm('确认重新初始化数据源', '提示！')
                .then(() => {
                    dataContainer.loading_2 = true;
                    publicApi
                        .initData()
                        .then(() => {
                            messageSuccess('更新成功');
                        })
                        .catch((res: any) => {
                            const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                            messageError(msg);
                        })
                        .finally(() => {
                            dataContainer.loading_2 = false;
                        });
                })
                .catch(() => {});
        }
        function removeAllHtml() {
            confirm('确认清除所有HTML', '提示！')
                .then(() => {
                    dataContainer.loading_3 = true;
                    publicApi
                        .removeAllHtml()
                        .then(() => {
                            messageSuccess('更新成功');
                        })
                        .catch((res: any) => {
                            const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                            messageError(msg);
                        })
                        .finally(() => {
                            dataContainer.loading_3 = false;
                        });
                })
                .catch(() => {});
        }
        function handleWriteInPostList() {
            confirm('确认缓存文章数据', '提示！')
                .then(() => {
                    dataContainer.loading_4 = true;
                    publicApi
                        .handleWriteInPostList()
                        .then(() => {
                            messageSuccess('更新成功');
                        })
                        .catch((res: any) => {
                            const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                            messageError(msg);
                        })
                        .finally(() => {
                            dataContainer.loading_4 = false;
                        });
                })
                .catch(() => {});
        }
        function createHtml() {
            confirm('确认创建html', '提示！')
                .then(() => {
                    dataContainer.loading_5 = true;
                    publicApi
                        .createHtml()
                        .then(() => {
                            messageSuccess('更新成功');
                        })
                        .catch((res: any) => {
                            const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                            messageError(msg);
                        })
                        .finally(() => {
                            dataContainer.loading_5 = false;
                        });
                })
                .catch(() => {});
        }
        function postRemoveRedundancy() {
            confirm('确认清除冗余文章', '提示！')
                .then(() => {
                    dataContainer.loading_6 = true;
                    publicApi
                        .postRemoveRedundancy()
                        .then(() => {
                            messageSuccess('更新成功');
                        })
                        .catch((res: any) => {
                            const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                            messageError(msg);
                        })
                        .finally(() => {
                            dataContainer.loading_6 = false;
                        });
                })
                .catch(() => {});
        }
        function fileRemoveRedundancy() {
            confirm('确认清除冗余上传文件', '提示！')
                .then(() => {
                    dataContainer.loading_7 = true;
                    publicApi
                        .fileRemoveRedundancy()
                        .then(() => {
                            messageSuccess('更新成功');
                        })
                        .catch((res: any) => {
                            const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                            messageError(msg);
                        })
                        .finally(() => {
                            dataContainer.loading_7 = false;
                        });
                })
                .catch(() => {});
        }
        function htmlRemoveRedundancy() {
            confirm('确认清除冗余HTML文件', '提示！')
                .then(() => {
                    dataContainer.loading_8 = true;
                    publicApi
                        .htmlRemoveRedundancy()
                        .then(() => {
                            messageSuccess('更新成功');
                        })
                        .catch((res: any) => {
                            const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                            messageError(msg);
                        })
                        .finally(() => {
                            dataContainer.loading_8 = false;
                        });
                })
                .catch(() => {});
        }
        return {
            dataContainer,
            initData,
            handleUpdateRss,
            handleUpdateSitemap,
            handleInitData,
            removeAllHtml,
            handleWriteInPostList,
            createHtml,
            postRemoveRedundancy,
            fileRemoveRedundancy,
            htmlRemoveRedundancy,
        };
    },
});
</script>

<template>
    <DefineScrollbar>
        <div class="page-container main-view">
            <div class="container">
                <div class="title">网站部分设置</div>
                <div class="title">RSS && Sitemap</div>
                <div class="bt-list">
                    <el-button
                        v-if="!dataContainer.isShow"
                        :loading="dataContainer.loading"
                        type="primary"
                        @click="handleUpdateRss"
                    >
                        更新 rss订阅文件
                    </el-button>
                    <el-button
                        v-if="!dataContainer.isShow"
                        :loading="dataContainer.loading_1"
                        type="primary"
                        @click="handleUpdateSitemap"
                    >
                        更新 Sitemap网站地图
                    </el-button>
                </div>
                <div class="title">数据</div>
                <div class="bt-list">
                    <el-button
                        v-if="!dataContainer.isShow"
                        :loading="dataContainer.loading_2"
                        type="primary"
                        @click="handleInitData"
                    >
                        重新初始化数据源
                    </el-button>
                    <el-button
                        v-if="!dataContainer.isShow"
                        :loading="dataContainer.loading_4"
                        type="primary"
                        @click="handleWriteInPostList"
                    >
                        确认缓存文章数据
                    </el-button>
                </div>
                <div class="title">HTML文件</div>
                <div class="bt-list">
                    <el-button
                        v-if="!dataContainer.isShow"
                        :loading="dataContainer.loading_3"
                        type="primary"
                        @click="removeAllHtml"
                        disabled
                    >
                        清除所有HTML
                    </el-button>
                    <el-button
                        v-if="!dataContainer.isShow"
                        :loading="dataContainer.loading_5"
                        type="primary"
                        @click="createHtml"
                    >
                        确认创建html
                    </el-button>
                </div>
                <div class="title">文件清理</div>
                <div class="bt-list">
                    <el-button
                        v-if="!dataContainer.isShow"
                        :loading="dataContainer.loading_6"
                        type="primary"
                        @click="postRemoveRedundancy"
                    >
                        确认清除冗余文章
                    </el-button>
                    <el-button
                        v-if="!dataContainer.isShow"
                        :loading="dataContainer.loading_7"
                        type="primary"
                        @click="fileRemoveRedundancy"
                    >
                        确认清除冗余上传文件
                    </el-button>
                    <el-button
                        v-if="!dataContainer.isShow"
                        :loading="dataContainer.loading_8"
                        type="primary"
                        @click="htmlRemoveRedundancy"
                    >
                        确认清除冗余html文件
                    </el-button>
                </div>
                <div style="height: 1000px">测试</div>
            </div>
        </div>
    </DefineScrollbar>
</template>

<style lang="scss" scoped>
.main-view {
    display: flex;
    flex-direction: column;
    width: 100%;
    .container {
        width: 100%;
        // min-height: 800px;
        height: fit-content;
        border-radius: 5px;
        padding: 30px 15px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 30px;
        justify-content: center;
        align-items: center;
        > .title {
            margin-bottom: 0;
            font-size: 17px;
            font-weight: bold;
            text-align: center;
        }
        > .bt-list {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
            gap: 15px;
            > * {
                margin: 0;
            }
        }
    }
}
</style>
