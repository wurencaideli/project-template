<script>
import { defineComponent, ref, reactive, nextTick } from 'vue';
import { copyDefaults } from '@/common/copy-defaults.js';
import fileApi from '@/http/file.js';
import { messageSuccess, messageError } from '@/action/message-prompt.js';
import uploadSingleFile from '@/components/upload-single-file.vue';
import {
    chooseFile,
    getMime,
    getMimeExtension,
    getSuffix,
    formatFileSize,
} from '@/common/file-select-tools.js';
import { userDataStore } from '@/store/user.js';
const configMap = {
    open: {
        default: false,
    },
    title: {
        default: '文件上传',
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
    components: {
        uploadSingleFile,
    },
    setup() {
        const userData = userDataStore();
        const configData = reactive(copyDefaults({}, {}, configMap));
        const UploadSingleImgRef = ref(null);
        const dataContainer = reactive({
            uploadApi: fileApi.upload_,
            loading: false,
            closeType: 'close', // close|confirm|cancel
            resolve: undefined,
            reject: undefined,
            form: {},
            fileName: '',
        });
        const otherDataContainer = {
            castParams: {},
        };
        function handleClose() {
            if (dataContainer.closeType == 'confirm') {
                dataContainer.resolve(otherDataContainer.castParams);
            } else {
                dataContainer.reject(dataContainer.closeType, otherDataContainer.castParams);
            }
        }
        function initData(show = true, data = {}, option = {}) {
            copyDefaults(configData, option, configMap);
            dataContainer.closeType = 'close';
            dataContainer.loading = false;
            dataContainer.form = {};
            otherDataContainer.castParams = {};
            configData.open = show;
            nextTick(() => {
                dataContainer.form = data;
            });
            return new Promise((r, j) => {
                dataContainer.resolve = r;
                dataContainer.reject = j;
            });
        }
        /** 手动上传文件 */
        function handleUpload() {
            if (!otherDataContainer.imgFile) return;
            if (!UploadSingleImgRef.value) return;
            dataContainer.loading = true;
            UploadSingleImgRef.value
                .handleUpload(otherDataContainer.imgFile)
                .then((res) => {
                    res = res.data || {};
                    if (res.status != 200) return Promise.reject(res);
                    /** 此处可以想后端提交保存的信息 */
                    messageSuccess(`文件上传成功`);
                    otherDataContainer.imgFile = undefined;
                    dataContainer.fileName = '';
                    otherDataContainer.castParams = {};
                    dataContainer.closeType = 'confirm';
                    configData.open = false;
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
        /** 文件选择事件 */
        function handleChange(file) {
            otherDataContainer.imgFile = file;
            dataContainer.fileName = file.name;
        }
        /** 文件选择事件 */
        function handleChoose() {
            if (!UploadSingleImgRef.value) return;
            chooseFile({
                multiple: false,
                accept: '',
            })
                .then((file) => {
                    /** 首先验证文件 */
                    if (!UploadSingleImgRef.value.verifyFile(file)) return;
                    otherDataContainer.imgFile = file;
                    dataContainer.fileName = file.name;
                })
                .catch(() => {
                    return;
                });
        }
        /** 上传组件成功事件 */
        function handleUploadSuccess() {
            return;
        }
        /** 上传组件失败事件 */
        function handleUploadFail() {
            messageError(`文件上传失败`);
        }
        /** 上传组件取消事件 */
        function handleUploadCancel() {
            otherDataContainer.imgFile = null;
            dataContainer.fileName = '';
        }
        return {
            userData,
            configData,
            dataContainer,
            UploadSingleImgRef,
            initData,
            handleClose,
            handleUploadSuccess,
            handleUploadFail,
            handleUploadCancel,
            handleUpload,
            handleChange,
            handleChoose,
        };
    },
});
</script>

<template>
    <el-dialog
        :title="configData.title + configData.afterTitle"
        v-model="configData.open"
        width="500px"
        :close-on-click-modal="false"
        append-to-body
        destroy-on-close
        @close="handleClose"
        class="edit-data-dialog"
    >
        <div class="dialog-container">
            <div class="upload-container">
                <uploadSingleFile
                    ref="UploadSingleImgRef"
                    :imgUrl="''"
                    :showCancelBt="true"
                    :maxSize="1024 * 1024 * 70"
                    :minSize="1"
                    :needAccept="''"
                    :autoUpload="false"
                    :showChooseBt="true"
                    :headers="{
                        token: userData.userInfo.token,
                    }"
                    :uploadApi="dataContainer.uploadApi"
                    @onSuccess="handleUploadSuccess"
                    @onChange="handleChange"
                    @onChoose="handleChoose"
                    @onFail="handleUploadFail"
                    @onCancel="handleUploadCancel"
                ></uploadSingleFile>
            </div>
            <p>文件名: {{ dataContainer.fileName }}</p>
            <el-button @click="handleUpload" type="primary" :loading="dataContainer.loading">
                上传
            </el-button>
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
            </div>
        </template>
    </el-dialog>
</template>

<style lang="scss" scoped>
.edit-data-dialog {
    .dialog-container {
        padding: 15px 15px 0 15px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        > * {
            margin-bottom: 30px;
            &:last-child {
                margin: 0;
            }
        }
        .upload-container {
            width: 100px;
            height: 100px;
        }
    }
}
</style>
