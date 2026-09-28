<script>
import { defineComponent, ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import SvgIcon from '@/components/svg-icon/index.vue';
import { Delete } from '@element-plus/icons-vue';
import { verifieData } from '@/common/verifie-tools.js';
import { messageError, messageSuccess } from '@/action/message-prompt.js';
import { findTag, updateTag, deleteTags } from '@/action/tag-list-tools.js';
import postApi from '@/http/post.js';
import definScrollbar from '@/components/defin-scrollbar.vue';
import { getMittInstance } from '@/common/define-event.js';
import mdEditor from '@/components/md-editor.vue';
import { themeList, typeList } from '@/action/option-list.js';

export default defineComponent({
    components: {
        SvgIcon,
        Delete,
        mdEditor,
    },
    setup() {
        const FormElRef = ref(null); //组件实例
        const router = useRouter();
        const route = useRoute();
        const dataContainer = reactive({
            isShow: false,
            loading: false,
            form: {},
            rules: {
                name: [{ required: true, message: '请输入数据', trigger: 'blur' }],
                content: [{ required: true, message: '请输入数据', trigger: 'blur' }],
            },
            typeList: typeList,
            themeList: themeList,
        });
        /**
         * 数据初始化
         */
        function initData() {
            let params = route.params;
            if (!params.sign) return;
            const querys = route.query || {};
            dataContainer.isShow = querys.isShow === 'true';
            dataContainer.form = {
                id: params.sign,
            };
            getInfo();
        }
        initData();
        function getInfo() {
            if (!dataContainer.form.id) return;
            if (dataContainer.loading) return;
            dataContainer.loading = true;
            postApi
                .info({
                    id: dataContainer.form.id,
                })
                .then((res) => {
                    const data = res.data || {};
                    dataContainer.form = data;
                    /** 更新标签 */
                    let tag = findTag(route.path) || {};
                    if (!tag) return;
                    updateTag({
                        tag: {
                            ...tag,
                            title: `文章${route.params.sign ? '修改' : '添加'}:${data.name}`,
                        },
                        layoutName: tag.layoutName,
                    });
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
        }
        /** 提交数据 */
        function handleSubmit() {
            /** 使用组件自带方法验证数据 */
            if (!FormElRef.value) return;
            FormElRef.value.validate((valid, e) => {
                if (e) {
                    /** 打印报错信息 */
                    let msg = e[Object.keys(e)[0]][0].message;
                    messageError(msg);
                }
                if (!valid) return;
                const verifiedData = validData(dataContainer.form);
                if (verifiedData) {
                    messageError(verifiedData[0].label);
                    return;
                }
                /** 向后端提交 */
                if (dataContainer.loading) return;
                dataContainer.loading = true;
                let task;
                if (dataContainer.form.id) {
                    task = postApi.update(dataContainer.form);
                } else {
                    task = postApi.add(dataContainer.form);
                }
                task.then((res) => {
                    messageSuccess('操作成功');
                    // 更新html文件
                    postApi.updatePostInfoHtml(res?.data?.id).catch(() => {});
                    /** 跳转到列表页面 */
                    let tag = findTag(route.path) || {};
                    deleteTags({ paths: tag.path, layoutName: tag.layoutName });
                    router.push({
                        name: 'post-list',
                    });
                    //刷新事件
                    let emitter = getMittInstance(`refreash-post-data`);
                    emitter.emit(`refreash`);
                })
                    .catch((res) => {
                        console.log(res);
                        let msg = '未知错误';
                        if (typeof res == 'object') {
                            msg = res.msg;
                        }
                        messageError(msg);
                    })
                    .finally(() => {
                        dataContainer.loading = false;
                    });
            });
        }
        /**
         * 数据验证
         * 外部可调用
         */
        function validData(data) {
            const failData = verifieData(data, {
                name(value, option) {
                    let label = `${option.key}:名称`;
                    const data = {};
                    if (!value && value !== 0) {
                        data.label = label + ' 不能为空';
                        return data;
                    }
                    return true;
                },
            });
            return failData;
        }
        return {
            dataContainer,
            initData,
            FormElRef,
            handleSubmit,
        };
    },
});
</script>

<template>
    <definScrollbar :loading="dataContainer.loading">
        <div class="page-container main-view">
            <div class="container">
                <el-form
                    :model="dataContainer.form"
                    ref="FormElRef"
                    :inline="true"
                    :rules="dataContainer.rules"
                    label-width="170px"
                >
                    <el-row :gutter="0">
                        <el-col :span="24" :xs="24">
                            <el-form-item label="标题" prop="name">
                                <el-input
                                    v-model="dataContainer.form.name"
                                    placeholder="请输入"
                                    clearable
                                    :disabled="dataContainer.isShow"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="24" :xs="24">
                            <el-form-item label="简介，描述" prop="synopsis">
                                <el-input
                                    v-model="dataContainer.form.synopsis"
                                    placeholder="请输入"
                                    clearable
                                    :rows="2"
                                    type="textarea"
                                    :disabled="dataContainer.isShow"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12" :xs="12">
                            <el-form-item label="标签(用|隔开)" prop="tags">
                                <el-input
                                    v-model="dataContainer.form.tags"
                                    placeholder="请输入"
                                    clearable
                                    :disabled="dataContainer.isShow"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="12" :xs="12">
                            <el-form-item label="列表中的图片" prop="listImg">
                                <el-input
                                    v-model="dataContainer.form.listImg"
                                    placeholder="请输入"
                                    clearable
                                    :disabled="dataContainer.isShow"
                                />
                            </el-form-item>
                        </el-col>
                        <el-col :span="24" :xs="24">
                            <el-form-item label="内容" prop="content">
                                <mdEditor
                                    :disabled="dataContainer.isShow"
                                    v-model:value="dataContainer.form.content"
                                ></mdEditor>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12" :xs="12">
                            <el-form-item label="是否隐藏" prop="hidden">
                                <el-select
                                    style="width: 100%"
                                    v-model="dataContainer.form.hidden"
                                    placeholder="请选择"
                                    clearable
                                    :disabled="dataContainer.isShow"
                                >
                                    <el-option :label="'是'" :value="true"></el-option>
                                    <el-option :label="'否'" :value="false"></el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="12" :xs="12">
                            <el-form-item label="是否置顶" prop="pinned">
                                <el-select
                                    style="width: 100%"
                                    v-model="dataContainer.form.pinned"
                                    placeholder="请选择"
                                    clearable
                                    :disabled="dataContainer.isShow"
                                >
                                    <el-option :label="'是'" :value="true"></el-option>
                                    <el-option :label="'否'" :value="false"></el-option>
                                </el-select>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
                <el-button
                    v-if="!dataContainer.isShow"
                    :loading="dataContainer.loading"
                    type="primary"
                    @click="handleSubmit"
                >
                    提交
                </el-button>
            </div>
        </div>
    </definScrollbar>
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
        padding: 15px;
        box-sizing: border-box;
        > * {
            margin: 0 0 30px 0;
            &:last-child {
                margin: 0;
            }
        }
        :deep(.el-form) {
            .el-form-item {
                width: 100% !important;
                margin: 0 0 15px 0 !important;
            }
        }
    }
}
</style>
