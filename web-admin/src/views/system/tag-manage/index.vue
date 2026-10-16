<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { messageSuccess, confirm } from '~/action/message-prompt.ts';
import { tagDataStore } from '~/store/tag.ts';
import {
    findTag,
    addTag,
    updateTag,
    deleteTags,
    deleteOtherTags,
    deleteLeftTags,
    deleteRightTags,
    refreshTag,
    getLatestTag,
    toLatestTag,
    clearAllTags,
} from '~/store/tag-manage.ts';
import { findPermissionConfigByRoutePath } from '~/store/user-manage.ts';
import type { Tag } from '~/types/tag.ts';
import type { PermissionItem } from '~/types/permission.ts';

export default defineComponent({
    name: 'TagManageView',
    setup() {
        const route = useRoute();
        const router = useRouter();
        const tagData = tagDataStore();
        const layoutGroupSign =
            findPermissionConfigByRoutePath(route.path)?.layoutGroupSign || 'main';
        /** 当前分组下的标签列表 */
        const tagList = computed(() => {
            return tagData.tagMap[layoutGroupSign]?.tagList || [];
        });
        /** 当前路由对应的标签 */
        const currentTag = computed(() => {
            return findTag(route.path, layoutGroupSign);
        });
        /** addTag：由权限配置生成标签，已存在则只更新routeFullPath */
        function handleAddTag() {
            const config = findPermissionConfigByRoutePath('/main/setup') || ({} as PermissionItem);
            addTag(
                Object.assign({}, config, {
                    routePath: '/main/setup',
                    routeFullPath: '/main/setup',
                    hasTag: true,
                }) as Tag,
            );
            messageSuccess('已添加（或更新）标签：' + (config.title || ''));
        }
        /** updateTag：按routePath合并修改，这里改标题 */
        function handleUpdateTag() {
            const tag = currentTag.value;
            if (!tag) return;
            updateTag({
                routePath: tag.routePath,
                layoutGroupSign: layoutGroupSign,
                title: tag.title + '-改',
            });
            messageSuccess('已修改当前标签标题');
        }
        /** refreshTag：经redirect中转一跳，刷新当前标签页的缓存 */
        function handleRefreshTag() {
            refreshTag({
                routePath: route.path,
                layoutGroupSign: layoutGroupSign,
            });
        }
        /** deleteTags：删除指定routePath的标签 */
        function handleDeleteCurrentTag() {
            deleteTags(route.path, layoutGroupSign);
            messageSuccess('已删除当前标签');
            toLatestTag(layoutGroupSign);
        }
        /** deleteOtherTags：保留指定标签，删除其余 */
        function handleDeleteOtherTags() {
            const tag = currentTag.value;
            if (!tag) return;
            deleteOtherTags(tag);
            messageSuccess('已删除其他标签');
        }
        /** deleteLeftTags：删除指定标签左侧的标签 */
        function handleDeleteLeftTags() {
            const tag = currentTag.value;
            if (!tag) return;
            deleteLeftTags(tag);
            messageSuccess('已删除左侧标签');
        }
        /** deleteRightTags：删除指定标签右侧的标签 */
        function handleDeleteRightTags() {
            const tag = currentTag.value;
            if (!tag) return;
            deleteRightTags(tag);
            messageSuccess('已删除右侧标签');
        }
        /** getLatestTag：取使用序号最大的标签并跳转 */
        function handleGoLatestTag() {
            const tag = getLatestTag(layoutGroupSign);
            if (!tag || !tag.routeFullPath) return;
            messageSuccess('最近使用的标签：' + tag.title);
            router.push(tag.routeFullPath);
        }
        /** toLatestTag：当前标签还在就不跳，没了才跳最近标签，一个都没有就回首页 */
        function handleToLatestTag() {
            toLatestTag(layoutGroupSign);
        }
        /** clearAllTags：清空所有分组的所有标签 */
        function handleClearAllTags() {
            confirm('确认清空所有标签？', '提示！')
                .then(() => {
                    clearAllTags();
                    messageSuccess('已清空');
                    toLatestTag(layoutGroupSign);
                })
                .catch(() => {});
        }
        return {
            tagList,
            currentTag,
            handleAddTag,
            handleUpdateTag,
            handleRefreshTag,
            handleDeleteCurrentTag,
            handleDeleteOtherTags,
            handleDeleteLeftTags,
            handleDeleteRightTags,
            handleGoLatestTag,
            handleToLatestTag,
            handleClearAllTags,
        };
    },
});
</script>

<template>
    <div class="page-container main-view">
        <div class="content-container page-content-box">
            <div class="top-container">
                <div class="left">
                    <el-button type="primary" @click="handleAddTag"> addTag </el-button>
                    <el-button plain type="primary" @click="handleUpdateTag"> updateTag </el-button>
                    <el-button plain type="primary" @click="handleRefreshTag">
                        refreshTag
                    </el-button>
                    <el-button
                        plain
                        type="danger"
                        :disabled="!currentTag"
                        @click="handleDeleteCurrentTag"
                    >
                        deleteTag
                    </el-button>
                    <el-button plain :disabled="!currentTag" @click="handleDeleteOtherTags">
                        deleteOtherTags
                    </el-button>
                    <el-button plain :disabled="!currentTag" @click="handleDeleteLeftTags">
                        deleteLeftTags
                    </el-button>
                    <el-button plain :disabled="!currentTag" @click="handleDeleteRightTags">
                        deleteRightTags
                    </el-button>
                    <el-button plain @click="handleGoLatestTag"> getLatestTag </el-button>
                    <el-button plain @click="handleToLatestTag"> toLatestTag </el-button>
                    <el-button plain type="danger" @click="handleClearAllTags">
                        clearAllTags
                    </el-button>
                </div>
            </div>
            <div class="tip-container">
                所有按钮直接调用 ~/store/tag-manage.ts
                的方法，顶部标签栏实时生效；标签的数据结构定义在
                ~/types/tag.ts，由权限配置附加路由定位字段生成。
            </div>
            <div class="table-container">
                <el-table :data="tagList" border height="100%">
                    <el-table-column
                        label="显示字样"
                        show-overflow-tooltip
                        align="left"
                        prop="title"
                        min-width="150"
                    />
                    <el-table-column
                        label="路由地址"
                        show-overflow-tooltip
                        align="left"
                        prop="routePath"
                        min-width="170"
                    />
                    <el-table-column
                        label="使用序号"
                        align="center"
                        prop="tagShowNumber"
                        width="100"
                    />
                    <el-table-column label="是否激活" align="center" width="100">
                        <template #default="scope">
                            <div>{{ scope.row.isActive ? '是' : '否' }}</div>
                        </template>
                    </el-table-column>
                    <el-table-column label="是否固定" align="center" width="100">
                        <template #default="scope">
                            <div>{{ scope.row.fixed ? '是' : '否' }}</div>
                        </template>
                    </el-table-column>
                    <el-table-column label="是否缓存" align="center" width="100">
                        <template #default="scope">
                            <div>{{ scope.row.isCache ? '是' : '否' }}</div>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.main-view {
    display: flex;
    flex-direction: column;
    /** 页面间隔css变量，可自行调节 */
    --view-gap: 10px;
    overflow: hidden;
    > .content-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: var(--view-gap) var(--view-gap);
        box-sizing: border-box;
        > .top-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 0px 0 var(--view-gap) 0;
            > .left {
                display: flex;
                flex-direction: row;
                align-items: center;
                flex-wrap: wrap;
                > * {
                    margin: 0 var(--view-gap) var(--view-gap) 0 !important;
                }
            }
        }
        > .tip-container {
            font-size: 13px;
            opacity: 0.6;
            margin: 0px 0 var(--view-gap) 0;
        }
        > .table-container {
            flex: 1 1 auto;
            height: 0;
            overflow: auto;
        }
    }
}
</style>
