<script lang="ts">
import { defineComponent, reactive, ref, computed } from 'vue';

import SvgIcon from '~/components/svg-icon.vue';
import { messageSuccess, confirm } from '~/action/message-prompt.ts';
import { deepCopyObj } from '~/common/common-tools.ts';
import { toTree } from '~/common/tree-tools.ts';
import { userDataStore } from '~/store/user.ts';
import { setPermissionList } from '~/store/user-manage.ts';
import EditDataDialog from './components/edit-data-dialog.vue';
import type { PermissionItem } from '~/types/permission.ts';

export default defineComponent({
    name: 'PermissionListView',
    components: {
        SvgIcon,
        EditDataDialog,
    },
    setup() {
        const userData = userDataStore();
        const editDataDialogRef = ref<any>(null);
        const dataContainer: any = reactive({
            form: {
                keyword: '',
                type: '',
            },
        });
        /** 按钮权限map，用于按钮的显示控制 */
        const permissionBtCodeMap = computed(() => {
            return userData.permissionBtCodeMap;
        });
        /** 过滤后转树形结构，供表格展示 */
        const tableTree = computed(() => {
            let list: PermissionItem[] = userData.permissionList || [];
            const keyword = dataContainer.form.keyword;
            const type = dataContainer.form.type;
            if (type) {
                list = list.filter((item: PermissionItem) => item.type == type);
            }
            if (keyword) {
                const hit = list.filter(
                    (item: PermissionItem) =>
                        (item.title || '').includes(keyword) ||
                        (item.nodeName || '').includes(keyword),
                );
                const nameSet = new Set(hit.map((item: PermissionItem) => item.nodeName));
                const byName = new Map(
                    list.map((item: PermissionItem) => [item.nodeName, item] as const),
                );
                /** 命中节点的祖先链也要保留，否则树形结构断裂 */
                hit.forEach((item: PermissionItem) => {
                    let parentName = item.parentNodeName;
                    while (parentName && byName.has(parentName) && !nameSet.has(parentName)) {
                        nameSet.add(parentName);
                        parentName = byName.get(parentName)!.parentNodeName;
                    }
                });
                list = list.filter((item: PermissionItem) => nameSet.has(item.nodeName));
            }
            return toTree(list, {
                key: 'nodeName',
                pKey: 'parentNodeName',
                childrenKey: 'children',
                isNew: true,
            });
        });
        /** 重置筛选 */
        function resetQuery() {
            dataContainer.form.keyword = '';
            dataContainer.form.type = '';
        }
        /** 新增 */
        function handleAdd() {
            if (!editDataDialogRef.value) return;
            editDataDialogRef.value
                .initData(
                    true,
                    {},
                    {
                        afterTitle: ' - 添加',
                    },
                )
                .then(() => {
                    messageSuccess('已添加');
                })
                .catch(() => {});
        }
        /** 编辑 */
        function handleEdit(row: PermissionItem) {
            if (!editDataDialogRef.value) return;
            editDataDialogRef.value
                .initData(
                    true,
                    {
                        ...row,
                    },
                    {
                        afterTitle: ' - 编辑',
                    },
                )
                .then(() => {
                    messageSuccess('已保存');
                })
                .catch(() => {});
        }
        /** 删除，连同子孙节点一起删除 */
        function handleDelete(row: PermissionItem) {
            confirm('确认删除该权限及其子权限？', '提示！')
                .then(() => {
                    const list: PermissionItem[] = deepCopyObj(userData.permissionList);
                    const removeNames = new Set([row.nodeName]);
                    let changed = true;
                    while (changed) {
                        changed = false;
                        list.forEach((item: PermissionItem) => {
                            if (
                                item.parentNodeName &&
                                removeNames.has(item.parentNodeName) &&
                                !removeNames.has(item.nodeName)
                            ) {
                                removeNames.add(item.nodeName);
                                changed = true;
                            }
                        });
                    }
                    const newList = list.filter(
                        (item: PermissionItem) => !removeNames.has(item.nodeName),
                    );
                    setPermissionList(newList);
                    messageSuccess('删除成功');
                })
                .catch(() => {});
        }
        return {
            dataContainer,
            permissionBtCodeMap,
            tableTree,
            editDataDialogRef,
            resetQuery,
            handleAdd,
            handleEdit,
            handleDelete,
        };
    },
});
</script>

<template>
    <div class="page-container main-view">
        <el-row :gutter="0" class="page-query-box">
            <el-col :span="24" :xs="24">
                <el-form :model="dataContainer.form" :inline="true" label-width="110px">
                    <el-row :gutter="0">
                        <el-col :span="8" :xs="8">
                            <el-form-item label="关键字" prop="keyword">
                                <el-input
                                    v-model="dataContainer.form.keyword"
                                    placeholder="显示字样或节点名称"
                                    clearable
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8" :xs="8">
                            <el-form-item label="权限类型" prop="type">
                                <el-select
                                    style="width: 100%"
                                    v-model="dataContainer.form.type"
                                    placeholder="请选择"
                                    clearable
                                >
                                    <el-option label="菜单" value="menu"></el-option>
                                    <el-option label="按钮" value="bt"></el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="8" :xs="8">
                            <el-form-item label=" ">
                                <el-button @click="resetQuery">
                                    <SvgIcon
                                        :style="'width:15px;height:15px;margin-right:5px;'"
                                        name="svg:rotate-cw.svg"
                                    ></SvgIcon>
                                    重置
                                </el-button>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
            </el-col>
        </el-row>
        <div class="content-container page-content-box">
            <div class="top-container">
                <div class="left">
                    <el-button
                        type="primary"
                        v-if="permissionBtCodeMap['permission-list:add']"
                        @click="handleAdd"
                    >
                        新增
                    </el-button>
                </div>
                <div class="tip">
                    修改直接写回权限store，左侧菜单和标签栏实时生效（页面刷新后恢复，数据源为mock）
                </div>
            </div>
            <div class="table-container">
                <el-table
                    :data="tableTree"
                    row-key="uId"
                    border
                    default-expand-all
                    :tree-props="{ children: 'children' }"
                    height="100%"
                >
                    <el-table-column
                        label="显示字样"
                        show-overflow-tooltip
                        align="left"
                        prop="title"
                        min-width="180"
                    />
                    <el-table-column label="类型" align="center" width="80">
                        <template #default="scope">
                            <el-tag :type="scope.row.type == 'bt' ? 'danger' : 'primary'">
                                {{ scope.row.type }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column
                        label="节点名称"
                        show-overflow-tooltip
                        align="left"
                        prop="nodeName"
                        min-width="150"
                    />
                    <el-table-column
                        label="父级节点"
                        show-overflow-tooltip
                        align="left"
                        prop="parentNodeName"
                        min-width="150"
                    />
                    <el-table-column
                        label="按钮编码"
                        show-overflow-tooltip
                        align="left"
                        prop="btCode"
                        min-width="150"
                    />
                    <el-table-column
                        label="路由地址"
                        show-overflow-tooltip
                        align="left"
                        prop="routePath"
                        min-width="160"
                    />
                    <el-table-column
                        label="路由规则"
                        show-overflow-tooltip
                        align="left"
                        prop="routePathRule"
                        min-width="160"
                    />
                    <el-table-column label="排序" align="center" prop="sort" width="70" />
                    <el-table-column label="操作" width="130" fixed="right">
                        <template #default="scope">
                            <el-button
                                link
                                type="primary"
                                v-if="permissionBtCodeMap['permission-list:update']"
                                @click="handleEdit(scope.row as PermissionItem)"
                            >
                                编辑
                            </el-button>
                            <el-button
                                link
                                type="danger"
                                v-if="permissionBtCodeMap['permission-list:delete']"
                                @click="handleDelete(scope.row as PermissionItem)"
                            >
                                删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
        </div>
        <EditDataDialog ref="editDataDialogRef"></EditDataDialog>
    </div>
</template>

<style lang="scss" scoped>
.main-view {
    display: flex;
    flex-direction: column;
    /** 页面间隔css变量，可自行调节 */
    --view-gap: 10px;
    overflow: hidden;
    > .page-query-box {
        margin: 0 0 var(--view-gap) 0 !important;
        padding: var(--view-gap) var(--view-gap) 0px var(--view-gap);
        :deep(.el-form-item) {
            margin-bottom: var(--view-gap) !important;
        }
        :deep(.el-form-item--default) {
            width: 100%;
            margin-right: 0;
        }
    }
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
                > * {
                    margin: 0 var(--view-gap) 0 0 !important;
                }
            }
            > .tip {
                font-size: 13px;
                opacity: 0.6;
            }
        }
        > .table-container {
            flex: 1 1 auto;
            height: 0;
            overflow: auto;
        }
    }
}
</style>
