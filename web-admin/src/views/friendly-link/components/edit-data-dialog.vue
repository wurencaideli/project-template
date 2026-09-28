<script>
/**
 * 数据编辑对话框
 * 使用外部调用的方式向内部传递数据
 * 使用promise的形式向外部通知状态
 */
import { defineComponent, ref, reactive, nextTick } from 'vue';
import { verifieData } from '@/common/verifie-tools.js';
import { copyDefaults } from '@/common/copy-defaults.js';
import friendlyLinkApi from '@/http/friendly-link.js';
import { messageSuccess, messageError } from '@/action/message-prompt.js';
/** 配置信息，初始化时使用 */
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
        //是否只是展示
        default: false,
    },
};

export default defineComponent({
    name: 'EditDataDialog',
    components: {},
    setup() {
        const configData = reactive(copyDefaults({}, {}, configMap));
        const FormElRef = ref(null); //组件实例
        const dataContainer = reactive({
            loading: false,
            closeType: 'close', //关闭时的类型，是由确认取消按钮关闭的还是其他地方关闭的 confirm cancel
            resolve: undefined, //返给外部promise的回调
            reject: undefined,
            form: {},
            rules: {
                name: [{ required: true, message: '名称', trigger: 'blur' }],
                link: [{ required: true, message: '跳转链接', trigger: 'blur' }],
            },
        });
        const otherDataContainer = {
            castParams: {}, //向外部传递的参数
        };
        /**
         * 对话框关闭时的回调
         * 根据行为类型来判断调用那个回调函数
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
         * 返回一个promise，以提供直接的回调
         */
        function initData(show = true, data = {}, option = {}) {
            copyDefaults(configData, option, configMap);
            dataContainer.closeType = 'close';
            dataContainer.loading = false;
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
                .then((res) => {
                    const data = res.data || {};
                    dataContainer.form = data;
                })
                .catch((res) => {
                    let msg = '未知错误';
                    if (typeof res == 'object') {
                        msg = res.msg;
                    }
                    messageError(msg);
                });
        }
        /** 验证信息 */
        function validBase(data) {
            const failData = verifieData(data, {
                name(value, option) {
                    let label = `${option.key}:名称`;
                    const data = {};
                    if (!value && value !== 0) {
                        data.label = label + ' 不能为空';
                        return data;
                    }
                    if (Object.prototype.toString.call(value) !== '[object String]') {
                        data.label = label + ' 必须是一个字符串';
                        return data;
                    }
                    if (value.length > 150) {
                        data.label = label + ' 字符长度超出150';
                        return data;
                    }
                    return true;
                },
                link(value, option) {
                    let label = `${option.key}:链接`;
                    const data = {};
                    if (!value && value !== 0) {
                        data.label = label + ' 不能为空';
                        return data;
                    }
                    if (Object.prototype.toString.call(value) !== '[object String]') {
                        data.label = label + ' 必须是一个字符串';
                        return data;
                    }
                    if (value.length > 300) {
                        data.label = label + ' 字符长度超出300';
                        return data;
                    }
                    return true;
                },
                icon(value, option) {
                    let label = `${option.key}:图片`;
                    const data = {};
                    if (!value && value !== 0) {
                        return true;
                    }
                    if (Object.prototype.toString.call(value) !== '[object String]') {
                        data.label = label + ' 必须是一个字符串';
                        return data;
                    }
                    if (value.length > 300) {
                        data.label = label + ' 字符长度超出300';
                        return data;
                    }
                    return true;
                },
                content(value, option) {
                    let label = `${option.key}:内容`;
                    const data = {};
                    if (!value && value !== 0) {
                        return true;
                    }
                    if (Object.prototype.toString.call(value) !== '[object String]') {
                        data.label = label + ' 必须是一个字符串';
                        return data;
                    }
                    if (value.length > 300) {
                        data.label = label + ' 字符长度超出300';
                        return data;
                    }
                    return true;
                },
            });
            return failData;
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
                const verifiedData = validBase(dataContainer.form);
                if (verifiedData) {
                    messageError(verifiedData[0].label);
                    return;
                }
                const params = Object.assign({}, dataContainer.form);
                let task;
                if (params.id) {
                    task = friendlyLinkApi.update(params);
                } else {
                    task = friendlyLinkApi.add(params);
                }
                task.then(() => {
                    messageSuccess('成功');
                    otherDataContainer.castParams = {};
                    dataContainer.closeType = 'confirm';
                    configData.open = false;
                }).catch((res) => {
                    let msg = '未知错误';
                    if (typeof res == 'object') {
                        msg = res.msg;
                    }
                    messageError(msg);
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
                    if (getTypeOf(value) !== '[object String]') {
                        data.label = label + ' 必须是一个字符串';
                        return data;
                    }
                    if (value.length > 300) {
                        data.label = label + ' 字符长度长度超出300';
                        return data;
                    }
                    return true;
                },
            });
            return failData;
        }
        return {
            configData,
            dataContainer,
            FormElRef,
            initData,
            handleClose,
            getDataInfo,
            handleSubmit,
            validData,
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
