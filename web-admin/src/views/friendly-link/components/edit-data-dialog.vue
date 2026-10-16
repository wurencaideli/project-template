<script lang="ts">
import { defineComponent, ref, reactive, nextTick } from 'vue';
import { z } from 'zod';

import { copyDefaults } from '~/common/copy-defaults.ts';
import friendlyLinkApi from '~/http/friendly-link.ts';
import { messageSuccess, messageError } from '~/action/message-prompt.ts';
const configMap = {
    open: {
        default: false,
    },
    title: {
        default: '友情链接',
    },
    afterTitle: {
        default: '',
    },
    isShow: {
        default: false,
    },
};

export default defineComponent({
    name: 'EditDataDialog',
    setup() {
        const configData: any = reactive(copyDefaults({}, {}, configMap));
        const FormElRef = ref<any>(null);
        const dataContainer: any = reactive({
            closeType: 'close',
            resolve: undefined,
            reject: undefined,
            form: {},
            rules: {
                name: [{ required: true, message: '名称', trigger: 'blur' }],
                link: [{ required: true, message: '跳转链接', trigger: 'blur' }],
            },
        });
        const otherDataContainer: any = {
            castParams: {},
        };
        /**
         * 对话框关闭时的回调
         */
        function handleClose() {
            if (dataContainer.closeType == 'confirm') {
                dataContainer.resolve(otherDataContainer.castParams);
            } else {
                dataContainer.reject(dataContainer.closeType, otherDataContainer.castParams);
            }
        }
        /**
         * 初始化数据（外部调用）
         */
        function initData(show = true, data = {}, option = {}) {
            copyDefaults(configData, option, configMap);
            dataContainer.closeType = 'close';
            dataContainer.form = {};
            otherDataContainer.castParams = {};
            configData.open = show;
            nextTick(() => {
                dataContainer.form = data;
                getDataInfo();
            });
            return new Promise((r, j) => {
                dataContainer.resolve = r;
                dataContainer.reject = j;
            });
        }
        /** 获取数据详细 */
        function getDataInfo() {
            if (!dataContainer.form.id) return;
            friendlyLinkApi
                .info(dataContainer.form)
                .then((res: any) => {
                    const data = res.data || {};
                    dataContainer.form = data;
                })
                .catch((res: any) => {
                    const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                    messageError(msg);
                });
        }
        /** 验证信息 */
        const validBaseSchema = z.object({
            name: z.string().min(1, '名称不能为空').max(150, '名称字符长度超出150'),
            link: z.string().min(1, '链接不能为空').max(300, '链接字符长度超出300'),
            icon: z.string().max(300, '图片字符长度超出300').optional(),
            content: z.string().max(300, '内容字符长度超出300').optional(),
        });
        function validBase(data: any) {
            const result = validBaseSchema.safeParse(data);
            if (result.success) return;
            return result.error.issues[0].message;
        }
        /** 提交数据 */
        function handleSubmit() {
            if (!FormElRef.value) return;
            FormElRef.value.validate((valid: any, e: any) => {
                if (e) {
                    const msg = e[Object.keys(e)[0]][0].message;
                    messageError(msg);
                }
                if (!valid) return;
                const verifiedData = validBase(dataContainer.form);
                if (verifiedData) {
                    messageError(verifiedData);
                    return;
                }
                const params = Object.assign({}, dataContainer.form);
                const task = params.id
                    ? friendlyLinkApi.update(params)
                    : friendlyLinkApi.add(params);
                task.then(() => {
                    messageSuccess('成功');
                    otherDataContainer.castParams = {};
                    dataContainer.closeType = 'confirm';
                    configData.open = false;
                }).catch((res: any) => {
                    const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                    messageError(msg);
                });
            });
        }
        return {
            configData,
            dataContainer,
            FormElRef,
            initData,
            handleClose,
            handleSubmit,
        };
    },
});
</script>

<template>
    <el-dialog
        :title="configData.title + configData.afterTitle"
        v-model="configData.open"
        width="700px"
        :close-on-click-modal="false"
        append-to-body
        destroy-on-close
        @close="handleClose"
        class="edit-data-dialog"
    >
        <div class="dialog-container">
            <el-form
                :model="dataContainer.form"
                ref="FormElRef"
                :inline="true"
                :rules="dataContainer.rules"
                label-width="100px"
            >
                <el-row :gutter="0">
                    <el-col :span="24" :xs="12">
                        <el-form-item label="名称" prop="name">
                            <el-input
                                v-model="dataContainer.form.name"
                                placeholder="请输入"
                                clearable
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :xs="12">
                        <el-form-item label="跳转链接" prop="link">
                            <el-input
                                v-model="dataContainer.form.link"
                                placeholder="请输入"
                                clearable
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :xs="12">
                        <el-form-item label="icon链接" prop="icon">
                            <el-input
                                v-model="dataContainer.form.icon"
                                placeholder="请输入"
                                clearable
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :xs="12">
                        <el-form-item label="内容" prop="content">
                            <el-input
                                v-model="dataContainer.form.content"
                                placeholder="请输入"
                                :rows="2"
                                type="textarea"
                                clearable
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" :xs="12">
                        <el-form-item label="是否隐藏" prop="hidden">
                            <el-select
                                style="width: 100%"
                                v-model="dataContainer.form.hidden"
                                placeholder="请选择"
                                clearable
                            >
                                <el-option :label="'是'" :value="true"></el-option>
                                <el-option :label="'否'" :value="false"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
        </div>
        <template #footer>
            <div class="dialog-footer">
                <el-button
                    @click="
                        () => {
                            dataContainer.closeType = 'cancel';
                            configData.open = false;
                        }
                    "
                >
                    取消
                </el-button>
                <el-button v-if="!configData.isShow" type="primary" @click="handleSubmit">
                    提交
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<style lang="scss" scoped>
.edit-data-dialog {
    .dialog-container {
        padding: 15px 15px 0 15px;
        box-sizing: border-box;
        :deep(.el-form-item) {
            width: 100%;
        }
    }
}
</style>
