<script lang="ts">
import { defineComponent, onBeforeUnmount, reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { saveAs } from 'file-saver';

import { copyValue } from '~/common/common-tools.ts';
import DictTags from '~/components/dict-tags.vue';
import { throttleFn } from '~/common/debounce-and-throttle.ts';
import { messageSuccess, confirm } from '~/action/message-prompt.ts';
import SvgIcon from '~/components/svg-icon.vue';
import postApi from '~/http/post.ts';
import { messageError } from '~/action/message-prompt.ts';
import { getMittInstance, destroyMittInstance } from '~/common/define-event.ts';
import { themeList, typeList } from '~/action/option-list.ts';
import { timestampToStr } from '~/common/date-tools.ts';
import { userDataStore } from '~/store/user.ts';

export default defineComponent({
    components: {
        DictTags,
        SvgIcon,
    },
    setup() {
        const QueryFormRef = ref<any>(null);
        const router = useRouter();
        const userData = userDataStore();
        /** 按钮权限map，用于按钮的显示控制 */
        const permissionBtCodeMap = computed(() => {
            return userData.permissionBtCodeMap;
        });
        const dataContainer: any = reactive({
            form: {},
            params: {
                page: 1,
                size: 15,
            },
            typeList: typeList,
            themeList: themeList,
            getDataStatus: {
                total: 0,
                list: [],
                loading: false,
                currentRows: [],
            },
            deleteDataStatus: {
                loading: false,
            },
            updateHtmlStatus: {
                loading: false,
            },
        });
        /** 获取数据列表 */
        const getDataList = throttleFn(function () {
            const getDataStatus = {
                total: 0,
                list: [],
                loading: true,
                currentRows: [],
            };
            dataContainer.getDataStatus = getDataStatus;
            const params = Object.assign({}, dataContainer.form, dataContainer.params);
            postApi
                .list(params)
                .then((res: any) => {
                    const data = res.data || {};
                    getDataStatus.list = data.list || [];
                    getDataStatus.total = data.total;
                })
                .catch((res: any) => {
                    const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                    messageError(msg);
                })
                .finally(() => {
                    getDataStatus.loading = false;
                    dataContainer.getDataStatus = { ...dataContainer.getDataStatus };
                });
        }, 300);
        getDataList();
        /** 双击单元格，复制单元格内容 */
        function handleCopyVale(_: any, __: any, ___: any, event: any) {
            copyValue(event.target.innerText);
            messageSuccess('复制成功，内容为：' + event.target.innerText);
        }
        /** 排序触发事件 */
        function handleSortChange(column: any) {
            dataContainer.form.orderByColumn = column.prop;
            dataContainer.form.isAsc = column.order;
            getDataList();
        }
        /** 搜索按钮操作 */
        function handleQuery() {
            dataContainer.params.page = 1;
            getDataList();
        }
        /** 重置按钮操作 */
        function resetQuery() {
            if (QueryFormRef.value) {
                QueryFormRef.value.resetFields();
            }
            dataContainer.form = {};
            handleQuery();
        }
        /** 导出数据 */
        function handleExport() {
            const str = '保存字符串的例子！！';
            const strData = new Blob([str], { type: 'text/plain;charset=utf-8' });
            saveAs(strData, '测试文件下载.txt');
            messageSuccess('导出成功！');
        }
        /** 新增按钮操作 */
        function handleAdd() {
            router.push({
                name: 'post-add',
            });
        }
        /** 详情按钮操作 */
        function handleDetails(row: any, query: any) {
            router.push({
                name: 'post-info',
                params: {
                    sign: row.id,
                },
                query: query,
            });
        }
        /** 编辑按钮操作 */
        function handleEdit(row: any, query: any) {
            router.push({
                name: 'post-update',
                params: {
                    sign: row.id,
                },
                query: query,
            });
        }
        /** 删除 */
        function handleDelete(rows: any) {
            confirm('确认删除所选数据？', '提示！')
                .then(async () => {
                    const deleteDataStatus = {
                        loading: true,
                    };
                    dataContainer.deleteDataStatus = deleteDataStatus;
                    const state = await postApi
                        .delete({
                            id: rows.map((item: any) => item.id).join(','),
                        })
                        .then(() => {
                            messageSuccess('删除成功');
                            return true;
                        })
                        .catch((res: any) => {
                            const msg =
                                res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                            messageError(msg);
                            return false;
                        })
                        .finally(() => {
                            deleteDataStatus.loading = false;
                            dataContainer.deleteDataStatus = { ...dataContainer.deleteDataStatus };
                        });
                    if (state) {
                        getDataList();
                    }
                })
                .catch(() => {});
        }
        /** 重新生成HTML文件 */
        function updatePostHtml() {
            confirm('确认重新生成HTML文件？', '提示！')
                .then(async () => {
                    const updateHtmlStatus = {
                        loading: true,
                    };
                    dataContainer.updateHtmlStatus = updateHtmlStatus;
                    await postApi
                        .updatePostHtml()
                        .then(() => {
                            messageSuccess('生成成功');
                            return true;
                        })
                        .catch((res: any) => {
                            const msg =
                                res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                            messageError(msg);
                            return false;
                        })
                        .finally(() => {
                            updateHtmlStatus.loading = false;
                            dataContainer.updateHtmlStatus = { ...dataContainer.updateHtmlStatus };
                        });
                })
                .catch(() => {});
        }
        /** 重新生成HTML文件 */
        function updatePostInfoHtml(data: any) {
            confirm('确认重新生成HTML文件？', '提示！')
                .then(async () => {
                    const updateHtmlStatus = {
                        loading: true,
                    };
                    dataContainer.updateHtmlStatus = updateHtmlStatus;
                    await postApi
                        .updatePostInfoHtml(data)
                        .then(() => {
                            messageSuccess('生成成功');
                            return true;
                        })
                        .catch((res: any) => {
                            const msg =
                                res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                            messageError(msg);
                            return false;
                        })
                        .finally(() => {
                            updateHtmlStatus.loading = false;
                            dataContainer.updateHtmlStatus = { ...dataContainer.updateHtmlStatus };
                        });
                })
                .catch(() => {});
        }
        /** 注册事件 */
        const emitter = getMittInstance(`refresh-post-data`);
        emitter.all?.clear();
        emitter.on(`refresh`, async () => {
            getDataList();
        });
        onBeforeUnmount(() => {
            destroyMittInstance(`refresh-post-data`);
        });
        return {
            QueryFormRef,
            dataContainer,
            permissionBtCodeMap,
            getDataList,
            handleCopyVale,
            handleSortChange,
            handleQuery,
            resetQuery,
            handleExport,
            handleAdd,
            handleDetails,
            handleEdit,
            handleDelete,
            timestampToStr,
            updatePostHtml,
            updatePostInfoHtml,
        };
    },
});
</script>

<template>
    <div class="page-container main-view">
        <el-row :gutter="0" class="page-query-box">
            <el-col :span="24" :xs="24">
                <el-form
                    :model="dataContainer.form"
                    ref="QueryFormRef"
                    :inline="true"
                    label-width="110px"
                >
                    <el-row :gutter="0">
                        <el-col :span="8" :xs="8">
                            <el-form-item label="文章标题" prop="name">
                                <el-input
                                    v-model="dataContainer.form.name"
                                    placeholder="请输入"
                                    clearable
                                    @clear="handleQuery"
                                    @keyup.enter="handleQuery"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8" :xs="8">
                            <el-form-item label="标签" prop="tags">
                                <el-input
                                    v-model="dataContainer.form.tags"
                                    placeholder="请输入"
                                    clearable
                                    @clear="handleQuery"
                                    @keyup.enter="handleQuery"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8" :xs="8">
                            <el-form-item label="是否隐藏" prop="hidden">
                                <el-select
                                    style="width: 100%"
                                    v-model="dataContainer.form.hidden"
                                    placeholder="请选择"
                                    clearable
                                    @clear="handleQuery"
                                    @change="handleQuery"
                                >
                                    <el-option :label="'是'" :value="true"></el-option>
                                    <el-option :label="'否'" :value="false"></el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="8" :xs="8">
                            <el-form-item label="是否置顶" prop="pinned">
                                <el-select
                                    style="width: 100%"
                                    v-model="dataContainer.form.pinned"
                                    placeholder="请选择"
                                    clearable
                                    @clear="handleQuery"
                                    @change="handleQuery"
                                >
                                    <el-option :label="'是'" :value="true"></el-option>
                                    <el-option :label="'否'" :value="false"></el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="8" :xs="8">
                            <el-form-item label=" ">
                                <el-button type="primary" @click="handleQuery">
                                    <SvgIcon
                                        :style="'width:15px;height:15px;margin-right:5px;'"
                                        name="svg:search.svg"
                                    ></SvgIcon>
                                    查询
                                </el-button>
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
                        v-if="permissionBtCodeMap['post-list:add']"
                        @click="handleAdd"
                    >
                        新增
                    </el-button>
                    <el-button
                        plain
                        type="primary"
                        v-if="permissionBtCodeMap['post-list:export']"
                        @click="handleExport"
                    >
                        导出
                    </el-button>
                    <el-button
                        plain
                        type="danger"
                        v-if="
                            permissionBtCodeMap['post-list:delete'] &&
                            dataContainer.getDataStatus.currentRows.length > 0
                        "
                        @click="handleDelete(dataContainer.getDataStatus.currentRows)"
                    >
                        批量删除：{{ dataContainer.getDataStatus.currentRows.length }}
                    </el-button>
                    <el-button plain type="primary" @click="updatePostHtml">
                        生成文章HTML文件
                    </el-button>
                </div>
                <div class="right">
                    <el-button circle @click="resetQuery">
                        <SvgIcon
                            :style="'width:15px;height:15px;'"
                            name="svg:rotate-cw.svg"
                        ></SvgIcon>
                    </el-button>
                </div>
            </div>
            <div class="table-container">
                <el-table
                    v-loading="
                        dataContainer.getDataStatus.loading ||
                        dataContainer.deleteDataStatus.loading ||
                        dataContainer.updateHtmlStatus.loading
                    "
                    :data="dataContainer.getDataStatus.list"
                    border
                    @cell-dblclick="handleCopyVale"
                    @sort-change="handleSortChange"
                    height="100%"
                >
                    <el-table-column
                        type="index"
                        align="center"
                        label="序号"
                        width="60"
                        fixed="left"
                    />
                    <el-table-column
                        label="是否隐藏"
                        show-overflow-tooltip
                        align="center"
                        prop="hidden"
                        width="100"
                    >
                        <template #default="scope">
                            <div>{{ scope.row.hidden ? '是' : '否' }}</div>
                        </template>
                    </el-table-column>
                    <el-table-column
                        label="是否置顶"
                        show-overflow-tooltip
                        align="center"
                        prop="pinned"
                        width="100"
                    >
                        <template #default="scope">
                            <div>{{ scope.row.pinned ? '是' : '否' }}</div>
                        </template>
                    </el-table-column>
                    <el-table-column
                        label="文章标题"
                        show-overflow-tooltip
                        align="center"
                        min-width="200"
                        prop="name"
                    >
                    </el-table-column>
                    <el-table-column
                        label="文章简介"
                        show-overflow-tooltip
                        align="center"
                        min-width="250"
                        prop="synopsis"
                    >
                    </el-table-column>
                    <el-table-column
                        label="标签"
                        show-overflow-tooltip
                        align="center"
                        prop="tags"
                        width="120"
                    >
                    </el-table-column>
                    <el-table-column
                        label="列表图片链接"
                        show-overflow-tooltip
                        align="center"
                        prop="listImg"
                        width="150"
                    >
                        <template #default="scope">
                            <el-image
                                v-if="!!scope.row.listImg"
                                style="width: 100px; height: 100px; border-radius: 5px"
                                :src="scope.row.listImg"
                                fit="contain"
                            >
                                <template #error>
                                    <div></div>
                                </template>
                            </el-image>
                        </template>
                    </el-table-column>
                    <el-table-column
                        label="创建时间"
                        show-overflow-tooltip
                        align="center"
                        prop="initDate"
                        width="180"
                    >
                        <template #default="scope">
                            <div>
                                {{ timestampToStr(scope.row.initDate, 'YYYY-MM-DD HH:mm:ss') }}
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column
                        label="更新时间"
                        show-overflow-tooltip
                        align="center"
                        prop="updateDate"
                        width="180"
                    >
                        <template #default="scope">
                            <div v-if="scope.row.updateDate">
                                {{ timestampToStr(scope.row.updateDate, 'YYYY-MM-DD HH:mm:ss') }}
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column
                        label="操作"
                        width="270"
                        fixed="right"
                        class-name="small-padding fixed-width"
                    >
                        <template #default="scope">
                            <el-button
                                link
                                type="default"
                                @click="
                                    handleDetails(scope.row, {
                                        isShow: true,
                                        afterTitle: ' - 查看',
                                    })
                                "
                            >
                                查看
                            </el-button>
                            <el-button
                                link
                                type="primary"
                                @click="
                                    handleEdit(scope.row, {
                                        isShow: false,
                                        afterTitle: ' - 编辑',
                                    })
                                "
                            >
                                编辑
                            </el-button>
                            <el-button link type="primary" @click="updatePostInfoHtml(scope.row)">
                                更新HTML
                            </el-button>
                            <el-button
                                link
                                type="danger"
                                v-if="permissionBtCodeMap['post-list:delete']"
                                @click="handleDelete([scope.row])"
                            >
                                删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <div class="pagination-container">
                <el-pagination
                    v-show="true"
                    :total="dataContainer.getDataStatus.total"
                    :background="true"
                    :current-page="dataContainer.params.page"
                    :page-size="dataContainer.params.size"
                    layout="total, sizes, prev, pager, next, jumper"
                    :page-sizes="[10, 20, 30, 50]"
                    :pager-count="7"
                    @size-change="
                        (size) => {
                            dataContainer.params.size = size;
                            getDataList();
                        }
                    "
                    @current-change="
                        (page) => {
                            dataContainer.params.page = page;
                            getDataList();
                        }
                    "
                />
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
            > .right {
                display: flex;
                flex-direction: row;
                align-items: center;
                justify-content: flex-end;
                > * {
                    margin: 0 0px 0 var(--view-gap) !important;
                }
            }
        }
        > .table-container {
            flex: 1 1 auto;
            height: 0;
            overflow: auto;
        }
    }
    .pagination-container {
        display: flex;
        justify-content: flex-end;
        padding: 0;
        margin: var(--view-gap) 0 0 0;
    }
}
</style>
