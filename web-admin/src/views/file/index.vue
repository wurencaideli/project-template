<script>
import { defineComponent, onBeforeUnmount, reactive, ref } from 'vue';
import { copyValue } from '@/common/other-tools.js';
import DictTags from '@/components/dict-tags.vue';
import { debounceFn } from '@/common/debounce-and-throttle.js';
import { messageSuccess, confirm } from '@/action/message-prompt.js';
import SvgIcon from '@/components/svg-icon/index.vue';
import { hasPermi } from '@/action/power-tools.js';
import { saveAs } from 'file-saver';
import fileApi from '@/http/file.js';
import { messageError } from '@/action/message-prompt.js';
import editDataDialog from './components/edit-data-dialog.vue';
import { timestampToStr } from '@/common/date-tools.js';
import {
    chooseFile,
    getMime,
    getMimeExtension,
    getSuffix,
    formatFileSize,
} from '@/common/file-select-tools.js';

export default defineComponent({
    components: {
        DictTags,
        SvgIcon,
        editDataDialog,
    },
    setup() {
        const QueryFormRef = ref(null);
        const editDataDialogRef = ref(null);
        const dataContainer = reactive({
            loading: false,
            form: {},
            params: {
                page: 1,
                size: 15,
            },
            config: {
                total: 0,
            },
            list: [],
            currentRows: [],
        });
        /** 获取数据列表 */
        const getDataList = debounceFn(function () {
            if (dataContainer.loading) return;
            dataContainer.loading = true;
            const params = Object.assign({}, dataContainer.form, dataContainer.params);
            fileApi
                .list(params)
                .then((res) => {
                    const data = res.data || {};
                    dataContainer.list = data.list || [];
                    dataContainer.config.total = data.total;
                    dataContainer.currentRows = [];
                })
                .catch((res) => {
                    let msg = '未知错误';
                    if (typeof res == 'object') {
                        msg = res.msg;
                    }
                    messageError(msg);
                })
                .finally(() => {
                    dataContainer.loading = false;
                });
        }, 300);
        getDataList();
        /** 双击单元格，复制单元格内容 */
        function handleCopyVale(_, __, ___, event) {
            copyValue(event.target.innerText);
            messageSuccess('复制成功，内容为：' + event.target.innerText);
        }
        /** 排序触发事件 */
        function handleSortChange(column, prop, order) {
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
            let str = '保存字符串的例子！！';
            let strData = new Blob([str], { type: 'text/plain;charset=utf-8' });
            saveAs(strData, '测试文件下载.txt');
            messageSuccess('导出成功！');
        }
        /** 新增按钮操作 */
        function handleAdd(row) {
            if (!editDataDialogRef.value) return;
            editDataDialogRef.value
                .initData(
                    true,
                    {
                        ...row,
                    },
                    {
                        afterTitle: ' - 添加',
                    },
                )
                .then(() => {
                    getDataList();
                })
                .catch(() => {});
        }
        /** 删除 */
        function handleDelete(rows) {
            confirm('确认删除所选数据？', '提示！')
                .then(async () => {
                    dataContainer.loading = true;
                    let state = await fileApi
                        .delete({
                            fileName: rows.map((item) => item.fileName).join(','),
                        })
                        .then(() => {
                            messageSuccess('删除成功');
                            return true;
                        })
                        .catch((res) => {
                            let msg = '未知错误';
                            if (typeof res == 'object') {
                                msg = res.msg;
                            }
                            messageError(msg);
                            return false;
                        })
                        .finally(() => {
                            dataContainer.loading = false;
                        });
                    if (state) {
                        getDataList();
                    }
                })
                .catch(() => {});
        }
        return {
            QueryFormRef,
            editDataDialogRef,
            dataContainer,
            formatFileSize,
            getDataList,
            handleCopyVale,
            handleSortChange,
            handleQuery,
            resetQuery,
            handleExport,
            handleAdd,
            handleDelete,
            hasPermi,
            timestampToStr,
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
                            <el-form-item label="文件名称" prop="fileName">
                                <el-input
                                    v-model="dataContainer.form.fileName"
                                    placeholder="请输入"
                                    clearable
                                    @clear="handleQuery"
                                    @keyup.enter="handleQuery"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8" :xs="8">
                            <el-form-item label="原文件名称" prop="originalName">
                                <el-input
                                    v-model="dataContainer.form.originalName"
                                    placeholder="请输入"
                                    clearable
                                    @clear="handleQuery"
                                    @keyup.enter="handleQuery"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8" :xs="8">
                            <el-form-item label="mime类型" prop="mimeType">
                                <el-input
                                    v-model="dataContainer.form.mimeType"
                                    placeholder="请输入"
                                    clearable
                                    @clear="handleQuery"
                                    @keyup.enter="handleQuery"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8" :xs="8">
                            <el-form-item label="文件地址" prop="path">
                                <el-input
                                    v-model="dataContainer.form.path"
                                    placeholder="请输入"
                                    clearable
                                    @clear="handleQuery"
                                    @keyup.enter="handleQuery"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="8" :xs="8">
                            <el-form-item label=" ">
                                <el-button type="primary" @click="handleQuery">
                                    <SvgIcon
                                        :style="'width:15px;height:15px;margin-right:5px;'"
                                        name="svg:search-bt.svg"
                                    ></SvgIcon>
                                    查询
                                </el-button>
                                <el-button @click="resetQuery">
                                    <SvgIcon
                                        :style="'width:15px;height:15px;margin-right:5px;'"
                                        name="svg:redo.svg"
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
                        v-if="hasPermi(['yx:apply:apply'])"
                        type="primary"
                        @click="handleAdd"
                    >
                        新增
                    </el-button>
                    <el-button plain type="primary" @click="handleExport"> 导出 </el-button>
                    <el-button
                        plain
                        type="danger"
                        v-if="dataContainer.currentRows.length > 0"
                        @click="handleDelete(dataContainer.currentRows)"
                    >
                        批量删除：{{ dataContainer.currentRows.length }}
                    </el-button>
                </div>
                <div class="right">
                    <el-button circle @click="resetQuery">
                        <SvgIcon :style="'width:15px;height:15px;'" name="svg:redo.svg"></SvgIcon>
                    </el-button>
                </div>
            </div>
            <div class="table-container">
                <el-table
                    v-loading="dataContainer.loading"
                    :data="dataContainer.list"
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
                        label="文件名"
                        show-overflow-tooltip
                        align="center"
                        min-width="170"
                        prop="fileName"
                    >
                        <template #default="scope">
                            <div>
                                <el-link type="primary" :href="scope.row.path" target="_blank">
                                    查看
                                </el-link>
                                {{ scope.row.fileName }}
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column
                        label="原文件名"
                        show-overflow-tooltip
                        align="center"
                        min-width="170"
                        prop="originalName"
                    >
                    </el-table-column>
                    <el-table-column
                        label="文件大小"
                        show-overflow-tooltip
                        align="center"
                        min-width="100"
                        prop="size"
                    >
                        <template #default="scope">
                            <div>{{ formatFileSize(scope.row.size || 0) }}</div>
                        </template>
                    </el-table-column>
                    <el-table-column
                        label="文件地址"
                        show-overflow-tooltip
                        align="center"
                        min-width="170"
                        prop="path"
                    >
                        <template #default="scope">
                            <a :href="scope.row.path" target="_blank" rel="">
                                {{ scope.row.path }}
                            </a>
                        </template>
                    </el-table-column>
                    <el-table-column
                        label="mime类型"
                        show-overflow-tooltip
                        align="center"
                        width="150"
                        prop="mimeType"
                    >
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
                        label="操作"
                        width="100"
                        fixed="right"
                        class-name="small-padding fixed-width"
                    >
                        <template #default="scope">
                            <el-button link type="danger" @click="handleDelete([scope.row])">
                                删除
                            </el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </div>
            <div class="pagination-container">
                <el-pagination
                    v-show="true"
                    :total="dataContainer.config.total"
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
        <editDataDialog ref="editDataDialogRef"></editDataDialog>
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
