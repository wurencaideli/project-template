<script lang="ts">
import { defineComponent, ref, reactive, nextTick } from 'vue';
import { z } from 'zod';

import { copyDefaults } from '~/common/copy-defaults.ts';
import { deepCopyObj } from '~/common/common-tools.ts';
import { getNanoid } from '~/common/guid.ts';
import { messageSuccess, messageError } from '~/action/message-prompt.ts';
import { userDataStore } from '~/store/user.ts';
import { setPermissionList } from '~/store/user-manage.ts';
import type { PermissionItem } from '~/types/permission.ts';

const configMap = {
    open: {
        default: false,
    },
    title: {
        default: '权限配置',
    },
    afterTitle: {
        default: '',
    },
};

export default defineComponent({
    name: 'EditDataDialog',
    setup() {
        const userData = userDataStore();
        const configData: any = reactive(copyDefaults({}, {}, configMap));
        const FormElRef = ref<any>(null);
        const dataContainer: any = reactive({
            closeType: 'close',
            resolve: undefined,
            reject: undefined,
            form: {},
            parentNodeNameList: [] as string[],
            rules: {
                title: [{ required: true, message: '显示字样', trigger: 'blur' }],
                nodeName: [{ required: true, message: '节点名称', trigger: 'blur' }],
            },
        });
        const otherDataContainer: any = {
            castParams: {}, //向外部传递的参数
        };
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
            dataContainer.parentNodeNameList = Array.from(
                new Set(userData.permissionList.map((item: PermissionItem) => item.nodeName)),
            );
            configData.open = show;
            nextTick(() => {
                dataContainer.form = Object.assign(
                    {
                        type: 'menu',
                        layoutGroupSign: 'main',
                        redirectName: 'main-redirect',
                        hasTag: true,
                        sort: 0,
                    },
                    data,
                );
            });
            return new Promise((r, j) => {
                dataContainer.resolve = r;
                dataContainer.reject = j;
            });
        }
        /** 验证信息 */
        const validBaseSchema = z.object({
            title: z.string().min(1, '显示字样不能为空').max(150, '显示字样字符长度超出150'),
            nodeName: z.string().min(1, '节点名称不能为空').max(150, '节点名称字符长度超出150'),
            type: z.enum(['menu', 'bt'], { message: '权限类型不正确' }),
            btCode: z.string().max(150, '按钮编码字符长度超出150').optional(),
            routePath: z.string().max(300, '路由地址字符长度超出300').optional(),
            routePathRule: z.string().max(300, '路由匹配规则字符长度超出300').optional(),
            routeParams: z.string().max(300, '路由参数字符长度超出300').optional(),
            menuIconName: z.string().max(150, '菜单图标字符长度超出150').optional(),
            content: z.string().max(300, '菜单详情字符长度超出300').optional(),
            tagIconName: z.string().max(150, '标签图标字符长度超出150').optional(),
        });
        function validBase(data: any) {
            const result = validBaseSchema.safeParse(data);
            if (result.success) return;
            return result.error.issues[0].message;
        }
        /** 菜单类型独有的字段，切换类型后清掉，避免残留干扰权限校验 */
        const menuOnlyKeys = [
            'layoutGroupSign',
            'redirectName',
            'routePath',
            'routeParams',
            'routePathRule',
            'menuIconName',
            'content',
            'number',
            'hidden',
            'isLink',
            'isCache',
            'fixed',
            'showTagIcon',
            'tagIconName',
            'hasTag',
        ];
        function cleanByType(data: any) {
            if (data.type == 'bt') {
                menuOnlyKeys.forEach((key: string) => delete data[key]);
            } else {
                delete data.btCode;
            }
            return data;
        }
        /** 提交数据，直接写回权限store */
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
                if (dataContainer.form.type == 'bt' && !dataContainer.form.btCode) {
                    messageError('按钮权限必须填写按钮编码');
                    return;
                }
                const list: PermissionItem[] = deepCopyObj(userData.permissionList);
                const form: any = Object.assign({}, dataContainer.form);
                form.sort = Number(form.sort) || 0;
                const index = list.findIndex((item: PermissionItem) => item.uId == form.uId);
                if (index == -1) {
                    form.uId = getNanoid();
                    list.push(cleanByType(form));
                } else {
                    list[index] = cleanByType(Object.assign({}, list[index], form));
                }
                setPermissionList(list);
                messageSuccess('成功');
                otherDataContainer.castParams = {};
                dataContainer.closeType = 'confirm';
                configData.open = false;
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
                label-width="110px"
            >
                <el-row :gutter="0">
                    <el-col :span="24" :xs="12">
                        <el-form-item label="显示字样" prop="title">
                            <el-input
                                v-model="dataContainer.form.title"
                                placeholder="请输入"
                                clearable
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :xs="12">
                        <el-form-item label="节点名称" prop="nodeName">
                            <el-input
                                v-model="dataContainer.form.nodeName"
                                placeholder="层级关系唯一标识"
                                clearable
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :xs="12">
                        <el-form-item label="父级节点" prop="parentNodeName">
                            <el-select
                                style="width: 100%"
                                v-model="dataContainer.form.parentNodeName"
                                placeholder="选择或输入节点名称"
                                filterable
                                allow-create
                                clearable
                            >
                                <el-option
                                    v-for="item in dataContainer.parentNodeNameList"
                                    :key="item"
                                    :label="item"
                                    :value="item"
                                ></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :xs="12">
                        <el-form-item label="权限类型" prop="type">
                            <el-radio-group v-model="dataContainer.form.type">
                                <el-radio value="menu">菜单 menu</el-radio>
                                <el-radio value="bt">按钮 bt</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :xs="12" v-if="dataContainer.form.type == 'bt'">
                        <el-form-item label="按钮编码" prop="btCode">
                            <el-input
                                v-model="dataContainer.form.btCode"
                                placeholder="如 permission-list:add"
                                clearable
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :xs="12" v-if="dataContainer.form.type == 'menu'">
                        <el-form-item label="分组标识" prop="layoutGroupSign">
                            <el-input
                                v-model="dataContainer.form.layoutGroupSign"
                                placeholder="布局分组，如 main"
                                clearable
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :xs="12" v-if="dataContainer.form.type == 'menu'">
                        <el-form-item label="重定向目标" prop="redirectName">
                            <el-input
                                v-model="dataContainer.form.redirectName"
                                placeholder="如 main-redirect"
                                clearable
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :xs="12" v-if="dataContainer.form.type == 'menu'">
                        <el-form-item label="路由地址" prop="routePath">
                            <el-input
                                v-model="dataContainer.form.routePath"
                                placeholder="跳转用，如 /main/post/list"
                                clearable
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :xs="12" v-if="dataContainer.form.type == 'menu'">
                        <el-form-item label="路由参数" prop="routeParams">
                            <el-input
                                v-model="dataContainer.form.routeParams"
                                placeholder="跳转时替换path末段"
                                clearable
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :xs="12" v-if="dataContainer.form.type == 'menu'">
                        <el-form-item label="路由规则" prop="routePathRule">
                            <el-input
                                v-model="dataContainer.form.routePathRule"
                                placeholder="权限校验用，path-to-regexp语法"
                                clearable
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :xs="12" v-if="dataContainer.form.type == 'menu'">
                        <el-form-item label="菜单图标" prop="menuIconName">
                            <el-input
                                v-model="dataContainer.form.menuIconName"
                                placeholder="如 svg:home.svg"
                                clearable
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :xs="12" v-if="dataContainer.form.type == 'menu'">
                        <el-form-item label="菜单详情" prop="content">
                            <el-input
                                v-model="dataContainer.form.content"
                                placeholder="菜单显示的详情"
                                clearable
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :xs="12" v-if="dataContainer.form.type == 'menu'">
                        <el-form-item label="菜单数字" prop="number">
                            <el-input
                                v-model="dataContainer.form.number"
                                placeholder="菜单显示的数字"
                                clearable
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" :xs="12" v-if="dataContainer.form.type == 'menu'">
                        <el-form-item label="是否隐藏" prop="hidden">
                            <el-switch v-model="dataContainer.form.hidden" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" :xs="12" v-if="dataContainer.form.type == 'menu'">
                        <el-form-item label="外部链接" prop="isLink">
                            <el-switch v-model="dataContainer.form.isLink" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" :xs="12" v-if="dataContainer.form.type == 'menu'">
                        <el-form-item label="生成标签" prop="hasTag">
                            <el-switch v-model="dataContainer.form.hasTag" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" :xs="12" v-if="dataContainer.form.type == 'menu'">
                        <el-form-item label="标签缓存" prop="isCache">
                            <el-switch v-model="dataContainer.form.isCache" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" :xs="12" v-if="dataContainer.form.type == 'menu'">
                        <el-form-item label="标签固定" prop="fixed">
                            <el-switch v-model="dataContainer.form.fixed" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12" :xs="12" v-if="dataContainer.form.type == 'menu'">
                        <el-form-item label="标签显图标" prop="showTagIcon">
                            <el-switch v-model="dataContainer.form.showTagIcon" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :xs="12" v-if="dataContainer.form.type == 'menu'">
                        <el-form-item label="标签图标" prop="tagIconName">
                            <el-input
                                v-model="dataContainer.form.tagIconName"
                                placeholder="如 svg:star.svg"
                                clearable
                            />
                        </el-form-item>
                    </el-col>
                    <el-col :span="24" :xs="12">
                        <el-form-item label="排序" prop="sort">
                            <el-input-number
                                style="width: 100%"
                                v-model="dataContainer.form.sort"
                                :min="0"
                            />
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
                <el-button type="primary" @click="handleSubmit"> 提交 </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<style lang="scss" scoped>
.edit-data-dialog {
    :deep(.el-dialog__body) {
        max-height: calc(100vh - 260px);
        overflow: auto;
    }
    .dialog-container {
        padding: 15px 15px 0 15px;
        box-sizing: border-box;
        :deep(.el-form-item) {
            width: 100%;
        }
    }
}
</style>
