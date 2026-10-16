<script lang="ts">
import { defineComponent, ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Delete } from '@element-plus/icons-vue';
import { z } from 'zod';

import SvgIcon from '~/components/svg-icon.vue';
import { messageError, messageSuccess } from '~/action/message-prompt.ts';
import { findTag, updateTag, deleteTags } from '~/store/tag-manage.ts';
import { findPermissionConfigByRoutePath } from '~/store/user-manage.ts';
import postApi from '~/http/post.ts';
import DefineScrollbar from '~/components/define-scrollbar.vue';
import { getMittInstance } from '~/common/define-event.ts';
import MdEditor from '~/components/md-editor.vue';
import { themeList, typeList } from '~/action/option-list.ts';

export default defineComponent({
    components: {
        SvgIcon,
        Delete,
        MdEditor,
    },
    setup() {
        const FormElRef = ref<any>(null);
        const router = useRouter();
        const route = useRoute();
        const dataContainer: any = reactive({
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
            const params = route.params;
            if (!params.sign) return;
            const query = route.query || {};
            dataContainer.isShow = query.isShow === 'true';
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
                .then((res: any) => {
                    const data = res.data || {};
                    dataContainer.form = data;
                    /** 更新标签 */
                    const config = findPermissionConfigByRoutePath(route.path);
                    const tag = findTag(route.path, config?.layoutGroupSign) || ({} as any);
                    if (!tag) return;
                    updateTag({
                        ...tag,
                        title: `文章${route.params.sign ? '修改' : '添加'}:${data.name}`,
                    });
                })
                .catch((res: any) => {
                    const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
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
            FormElRef.value.validate((valid: any, e: any) => {
                if (e) {
                    /** 打印报错信息 */
                    const msg = e[Object.keys(e)[0]][0].message;
                    messageError(msg);
                }
                if (!valid) return;
                const verifiedData = validData(dataContainer.form);
                if (verifiedData) {
                    messageError(verifiedData);
                    return;
                }
                /** 向后端提交 */
                if (dataContainer.loading) return;
                dataContainer.loading = true;
                const task = dataContainer.form.id
                    ? postApi.update(dataContainer.form)
                    : postApi.add(dataContainer.form);
                task.then((res: any) => {
                    messageSuccess('操作成功');
                    // 更新html文件
                    postApi.updatePostInfoHtml(res?.data?.id).catch(() => {});
                    /** 跳转到列表页面 */
                    const config = findPermissionConfigByRoutePath(route.path);
                    const tag = findTag(route.path, config?.layoutGroupSign) || ({} as any);
                    deleteTags(tag.routePath, tag.layoutGroupSign);
                    router.push({
                        name: 'post-list',
                    });
                    //刷新事件
                    const emitter = getMittInstance(`refresh-post-data`);
                    emitter.emit(`refresh`);
                })
                    .catch((res: any) => {
                        console.log(res);
                        const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
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
        const validDataSchema = z.object({
            name: z.string().min(1, '名称不能为空'),
        });
        function validData(data: any) {
            const result = validDataSchema.safeParse(data);
            if (result.success) return;
            return result.error.issues[0].message;
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
    <DefineScrollbar>
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
                                <MdEditor
                                    :disabled="dataContainer.isShow"
                                    v-model:value="dataContainer.form.content"
                                ></MdEditor>
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
