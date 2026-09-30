import { ChangeDetectionStrategy, Component, input } from '@angular/core';
/**
 * 各图表区域标题(带左侧装饰线)。
 */
@Component({
    selector: 'chart-head-cp',
    standalone: true,
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartHeadCpComponent {
    readonly title = input<string>('');
}