import { Injectable, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { InfoDialogService } from './info-dialog/service';
import { InfoDialogHandle } from './info-dialog/service';
export interface CommonData {
    viewSizeChangeNumber: number;
    refreshNumber: number;
    disTemplate: { titleZh?: string; titleCh?: string; titleEn?: string; mapType?: string };
    fillMap: boolean;
}
@Injectable()
export class DashboardService {
    dashboardBody: any;
    dashboardBodyContainer: any;
    baseWidth = 1920;
    baseHeight = 1080;
    activeWidth = 0; //理论容器的宽度
    activeHeight = 0;
    scalingFactor = 0; //缩放倍数
    fillingWidth = 0; //填充宽度，为实际宽度
    fillingHeight = 0;
    //服务的公共数据，改变后需要通知
    commonData: any = {
        viewSizeChangeNumber: 0, //大小变化的次数
        refreshNumber: 0, //刷新的次数，全局可手动刷新
        disTemplate: { mapType: 'shandong' }, //模版数据,mapType 决定地图加载 assets/geo 下的哪份 GeoJSON
        fillMap: false, //是否全屏地图组件
    };
    commonDataChanged = new EventEmitter<any>();
    /** 已打开的事件选择对话框实例：保留在内存中以便二次打开直接 remount */
    private infoDialogHandle: InfoDialogHandle | null = null;
    constructor(
        private infoDialogService: InfoDialogService,
        private translateService: TranslateService,
    ) {}
    /** 写入全局css变量 */
    writeGlobalCssVariable() {
        if (!this.dashboardBody) return;
        const varObj: any = {
            '--dashboard-scaling-factor': `${this.scalingFactor}`,
        };
        Object.keys(varObj).forEach((key) => {
            this.dashboardBody.style.setProperty(key, varObj[key]);
        });
    }
    /** 设置容器大小，保持比例 */
    setupContainerSize(options: any) {
        this.dashboardBody = options.dashboardBody;
        this.dashboardBodyContainer = options.dashboardBodyContainer;
        if (!this.dashboardBody || !this.dashboardBodyContainer) return;
        const rect = this.dashboardBody.getBoundingClientRect();
        const needProportion = this.baseWidth / this.baseHeight;
        const proportion = rect.width / rect.height;
        let width = 0;
        let height = 0;
        let fillingWidth = 0;
        let fillingHeight = 0;
        if (proportion > needProportion) {
            // 表示宽度富裕，可以适当扩展宽度
            width = rect.height * needProportion;
            height = rect.height;
            fillingWidth = Math.min(width * 1, rect.width);
            fillingHeight = height;
        } else {
            width = rect.width;
            height = rect.width / needProportion;
            fillingHeight = Math.min(height * 1.2, rect.height);
            fillingWidth = width;
        }
        this.applyContainerSize({ width, height, fillingWidth, fillingHeight });
    }
    /** 设置容器大小，按 cover 模式铺满屏幕(内容按 baseWidth/baseHeight 比例放大,超出部分裁剪) */
    setupContainerSizeCover(options: any) {
        this.dashboardBody = options.dashboardBody;
        this.dashboardBodyContainer = options.dashboardBodyContainer;
        if (!this.dashboardBody || !this.dashboardBodyContainer) return;
        const rect = this.dashboardBody.getBoundingClientRect();
        const needProportion = this.baseWidth / this.baseHeight;
        const proportion = rect.width / rect.height;
        let width = 0;
        let height = 0;
        if (proportion > needProportion) {
            // 屏幕相对更宽，以宽度为基准满铺(高度可能超出)
            width = rect.width;
            height = rect.width / needProportion;
        } else {
            // 屏幕相对更窄或相等，以高度为基准满铺(宽度可能超出)
            height = rect.height;
            width = rect.height * needProportion;
        }
        this.applyContainerSize({
            width,
            height,
            fillingWidth: width,
            fillingHeight: height,
        });
    }
    /** 设置容器大小，fixed 模式:直接按设计图尺寸(baseWidth×baseHeight)展示,不随屏幕缩放 */
    setupContainerSizeFixed(options: any) {
        this.dashboardBody = options.dashboardBody;
        this.dashboardBodyContainer = options.dashboardBodyContainer;
        if (!this.dashboardBody || !this.dashboardBodyContainer) return;
        this.applyContainerSize({
            width: this.baseWidth,
            height: this.baseHeight,
            fillingWidth: this.baseWidth,
            fillingHeight: this.baseHeight,
        });
    }
    /** 将计算结果应用到 service 状态、DOM 与订阅者 */
    private applyContainerSize(size: {
        width: number;
        height: number;
        fillingWidth: number;
        fillingHeight: number;
    }) {
        const { width, height, fillingWidth, fillingHeight } = size;
        const isChanged = fillingWidth != this.fillingWidth || fillingHeight != this.fillingHeight;
        this.activeWidth = width;
        this.activeHeight = height;
        this.fillingWidth = fillingWidth;
        this.fillingHeight = fillingHeight;
        const scalingFactor = width / this.baseWidth;
        this.scalingFactor = scalingFactor;
        const roundedFillingWidth = Math.round(fillingWidth);
        const roundedFillingHeight = Math.round(fillingHeight);
        this.dashboardBodyContainer.style.width = `${roundedFillingWidth}px`;
        this.dashboardBodyContainer.style.minWidth = `${roundedFillingWidth}px`;
        this.dashboardBodyContainer.style.height = `${roundedFillingHeight}px`;
        this.dashboardBodyContainer.style.minHeight = `${roundedFillingHeight}px`;
        this.writeGlobalCssVariable();
        if (scalingFactor === 0 && this.commonData.viewSizeChangeNumber === 0) return; // 如果第一次渲染宽度不够直接放弃
        if (!isChanged) return;
        this.commonData.viewSizeChangeNumber++;
        this.dashboardBodyContainer.getBoundingClientRect();
        this.commonDataChanged.emit();
    }
    /** 打开事件选择弹窗。二次打开复用已有实例,直接 remount 并刷新表单数据。 */
    showInfo(option: any = {}) {
        const title = this.translateService.instant('info_dialog_event_list_title');
        if (this.infoDialogHandle && !this.infoDialogHandle.isDestroy) {
            this.infoDialogHandle.show(true);
            const inst: any = this.infoDialogHandle.modalInstance.componentInstance;
            if (inst && typeof inst.initData === 'function') {
                inst.initData(
                    Object.assign({}, option, {
                        title,
                    }),
                );
            }
            return;
        }
        this.infoDialogHandle = this.infoDialogService.create(
            Object.assign({}, option, {
                container: this.dashboardBody,
                title,
                onCancel: () => {
                    this.infoDialogHandle?.show(false);
                },
                onConfirm: () => {
                    this.infoDialogHandle?.show(false);
                },
            }),
        );
    }
}
