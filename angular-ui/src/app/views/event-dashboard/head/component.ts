import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * 仪表盘各区块顶部标题。仅作为样式占位元素。
 */
@Component({
    selector: 'head-cp',
    standalone: true,
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeadCpComponent {
    readonly title = input<string>('');
}