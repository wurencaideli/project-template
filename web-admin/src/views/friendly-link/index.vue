<script>
import { defineComponent, onBeforeUnmount, reactive, ref } from 'vue';
import { copyValue } from '@/common/other-tools.js';
import DictTags from '@/components/dict-tags.vue';
import { debounceFn } from '@/common/debounce-and-throttle.js';
import { messageSuccess, confirm } from '@/action/message-prompt.js';
import SvgIcon from '@/components/svg-icon/index.vue';
import { hasPermi } from '@/action/power-tools.js';
import { saveAs } from 'file-saver';
import friendlyLinkApi from '@/http/friendly-link.js';
import { messageError } from '@/action/message-prompt.js';
import editDataDialog from './components/edit-data-dialog.vue';
import { timestampToStr } from '@/common/date-tools.js';

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
            friendlyLinkApi
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
        /** 详情按钮操作 */
        function handleDetails(row, querys) {
            if (!editDataDialogRef.value) return;
            editDataDialogRef.value
                .initData(
                    true,
                    {
                        ...row,
                    },
                    {
                        afterTitle: ' - 查看',
                        isShow: true,
                    },
                )
                .then(() => {
                    return;
                })
                .catch(() => {});
        }
        /** 编辑按钮操作 */
        function handleEdit(row, querys) {
            if (!editDataDialogRef.value) return;
            editDataDialogRef.value
                .initData(
                    true,
                    {
                        ...row,
                    },
                    {
                        afterTitle: ' - 修改',
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
                    let state = await friendlyLinkApi
                        .delete({
                            id: rows.map((item) => item.id).join(','),
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
        function updateHtml() {
            confirm('确认更新HTML文件？', '提示！')
                .then(async () => {
                    dataContainer.loading = true;
                    await friendlyLinkApi
                        .updateHtml()
                        .then(() => {
                            messageSuccess('更新成功');
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
                })
                .catch(() => {});
        }
        return {
            QueryFormRef,
            editDataDialogRef,
            dataContainer,
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
            hasPermi,
            timestampToStr,
            updateHtml,
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
                            <el-form-item label="名称" prop="name">
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
                            <el-form-item label="跳转链接" prop="link">
                                <el-input
                                    v-model="dataContainer.form.link"
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
                    <el-button plain type="primary" @click="updateHtml"> 更新HTML文件 </el-button>
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
                        label="名称"
                        show-overflow-tooltip
                        align="center"
                        min-width="170"
                        prop="name"
                    >
                    </el-table-column>
                    <el-table-column
                        label="内容"
                        show-overflow-tooltip
                        align="center"
                        min-width="170"
                        prop="content"
                    >
                    </el-table-column>
                    <el-table-column
                        label="跳转链接"
                        show-overflow-tooltip
                        align="center"
                        width="180"
                        prop="link"
                    >
                        <template #default="scope">
                            <div>
                                <el-link type="primary" :href="scope.row.link" target="_blank">
                                    跳转
                                </el-link>
                                {{ scope.row.link }}
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column
                        label="icon链接"
                        show-overflow-tooltip
                        align="center"
                        prop="icon"
                        width="100"
                    >
                        <template #default="scope">
                            <el-image
                                v-if="!!scope.row.icon"
                                style="width: 50px; height: 50px; border-radius: 5px"
                                :src="scope.row.icon"
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
                                {{
                                    scope.row.initDate
                                        ? timestampToStr(scope.row.initDate, 'YYYY-MM-DD HH:mm:ss')
                                        : ''
                                }}
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column
                        label="更新时间"
                        show-overflow-tooltip
                        align="center"
                        prop="updateDate"
                        width="150"
                    >
                        <template #default="scope">
                            <div>
                                {{
                                    scope.row.updateDate
                                        ? timestampToStr(
                                              scope.row.updateDate,
                                              'YYYY-MM-DD HH:mm:ss SSS',
                                          )
                                        : ''
                                }}
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column
                        label="操作"
                        width="170"
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
