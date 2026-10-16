<script lang="ts">
import { defineComponent, ref, reactive } from 'vue';

import SvgIcon from '~/components/svg-icon.vue';
import { messageError, messageSuccess, confirm } from '~/action/message-prompt.ts';
import { toTrim } from '~/common/common-tools.ts';
import { throttleFn } from '~/common/debounce-and-throttle.ts';
import { userDataStore } from '~/store/user.ts';
import userApi from '~/http/user.ts';
import { themeList, typeList } from '~/action/option-list.ts';
import DefineScrollbar from '~/components/define-scrollbar.vue';
import MdEditor from '~/components/md-editor.vue';

export default defineComponent({
    components: {
        SvgIcon,
        DefineScrollbar,
        MdEditor,
    },
    setup() {
        const userData = userDataStore();
        const FormElRef = ref<any>(null);
        const dataContainer: any = reactive({
            loading: false,
            form: {},
            rules: {
                nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
            },
            typeList: typeList,
            themeList: themeList,
        });
        /** 初始化数据 */
        function initData() {
            Object.assign(dataContainer.form, userData.info);
            getUserInfo();
        }
        initData();
        /** 获取用户数据详情 */
        function getUserInfo() {
            if (!dataContainer.form.id) return;
            dataContainer.loading = true;
            userApi
                .info()
                .then((res: any) => {
                    const data = res.data || {};
                    dataContainer.form = data;
                })
                .catch((res: any) => {
                    const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                    messageError(msg);
                })
                .finally(() => {
                    dataContainer.loading = false;
                });
        }
        /** 保存操作 */
        const handleSubmit = throttleFn(function () {
            if (!FormElRef.value || dataContainer.loading) return;
            FormElRef.value.validate((valid: any, e: any) => {
                if (!valid) {
                    const message = e[Object.keys(e)[0]][0].message;
                    messageError(message);
                    return;
                }
                confirm('确认修改', '提示！')
                    .then(() => {
                        dataContainer.loading = true;
                        userApi
                            .update(dataContainer.form)
                            .then((res: any) => {
                                messageSuccess('修改成功');
                                const data = res.data || {};
                                userData.setUserInfo(Object.assign({}, userData.info, data));
                                // 更新HTML文件
                                userApi.updateAboutHtml().catch(() => {
                                    return;
                                });
                            })
                            .catch((res: any) => {
                                const msg = res?.msg || (typeof res == 'object' ? '' : res) || '未知错误';
                                messageError(msg);
                            })
                            .finally(() => {
                                dataContainer.loading = false;
                            });
                    })
                    .catch(() => {});
            });
        }, 700);
        return {
            dataContainer,
            FormElRef,
            handleSubmit,
            toTrim,
        };
    },
});
</script>

<template>
    <DefineScrollbar>
        <div class="page-container mine-update-view">
            <div class="container">
                <el-image class="img" :src="dataContainer.form.avatar" fit="cover" />
                <el-form
                    :model="dataContainer.form"
                    ref="FormElRef"
                    :inline="false"
                    :rules="dataContainer.rules"
                    label-width="150px"
                    style="width: 100%"
                >
                    <el-row :gutter="0">
                        <el-col :span="24">
                            <el-form-item label="昵称" prop="nickname">
                                <el-input
                                    @input="
                                        () => {
                                            dataContainer.form.nickname = toTrim(
                                                dataContainer.form.nickname,
                                            );
                                        }
                                    "
                                    :clearable="true"
                                    placeholder=""
                                    v-model="dataContainer.form.nickname"
                                >
                                </el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item label="头像" prop="avatar">
                                <el-input
                                    @input="
                                        () => {
                                            dataContainer.form.avatar = toTrim(
                                                dataContainer.form.avatar,
                                            );
                                        }
                                    "
                                    :clearable="true"
                                    v-model="dataContainer.form.avatar"
                                >
                                </el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item label="站点ico" prop="favicon">
                                <el-input
                                    @input="
                                        () => {
                                            dataContainer.form.favicon = toTrim(
                                                dataContainer.form.favicon,
                                            );
                                        }
                                    "
                                    :clearable="true"
                                    v-model="dataContainer.form.favicon"
                                >
                                </el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item label="简介" prop="synopsis">
                                <el-input
                                    :clearable="true"
                                    v-model="dataContainer.form.synopsis"
                                    type="textarea"
                                >
                                </el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item label="giscus评论仓库" prop="giscusDataRepo">
                                <el-input
                                    :clearable="true"
                                    v-model="dataContainer.form.giscusDataRepo"
                                    type="textarea"
                                >
                                </el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item label="giscus评论仓库ID" prop="giscusDataRepoId">
                                <el-input
                                    :clearable="true"
                                    v-model="dataContainer.form.giscusDataRepoId"
                                    type="textarea"
                                >
                                </el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item label="giscus评论分类名" prop="giscusDataCategory">
                                <el-input
                                    :clearable="true"
                                    v-model="dataContainer.form.giscusDataCategory"
                                    type="textarea"
                                >
                                </el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item label="giscus评论分类ID" prop="giscusDataCategoryId">
                                <el-input
                                    :clearable="true"
                                    v-model="dataContainer.form.giscusDataCategoryId"
                                    type="textarea"
                                >
                                </el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="24">
                            <el-form-item label="站点统计脚本" prop="siteCountScript">
                                <el-input
                                    :clearable="true"
                                    v-model="dataContainer.form.siteCountScript"
                                    type="textarea"
                                >
                                </el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="24" :xs="24">
                            <el-form-item label="关于" prop="about">
                                <MdEditor
                                    :disabled="dataContainer.isShow"
                                    v-model:value="dataContainer.form.about"
                                ></MdEditor>
                            </el-form-item>
                        </el-col>
                    </el-row>
                </el-form>
                <el-button :loading="dataContainer.loading" type="primary" @click="handleSubmit">
                    提交
                </el-button>
            </div>
        </div>
    </DefineScrollbar>
</template>

<style lang="scss" scoped>
.mine-update-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 15px;
    box-sizing: border-box;
    > .container {
        width: 100%;
        max-width: 1400px;
        padding: 60px 15px;
        box-sizing: border-box;
        background-color: var(--bg-color);
        border-radius: 12px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        flex-direction: column;
        > .img {
            width: 150px;
            height: 150px;
            border-radius: 50%;
            margin-bottom: 60px;
            border: 2px solid rgba(0, 0, 0, 0.421);
        }
    }
}
</style>
