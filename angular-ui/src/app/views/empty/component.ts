import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'empty-view',
    standalone: true,
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyComponent {
    private readonly translate = inject(TranslateService);
    readonly text = toSignal(this.translate.stream('empty_text'), {
        initialValue: this.translate.instant('empty_text'),
    });
}