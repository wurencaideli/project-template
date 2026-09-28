import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';

import { SvgIconComponent } from '../../components/svg-icon/component';
import { ICON_LIST } from '../../../generated/icon-list';

const PAGE_SIZE = 60;

@Component({
    selector: 'icon-showcase-view',
    standalone: true,
    imports: [SvgIconComponent, FormsModule],
    templateUrl: './component.html',
    styleUrls: ['./component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconShowcaseComponent {
    private readonly translate = inject(TranslateService);

    readonly icons = ICON_LIST;
    readonly keyword = signal('');
    readonly pageIndex = signal(1);

    readonly summary = toSignal(
        this.translate.stream('icon_showcase_summary').pipe(map((t) => t)),
        { initialValue: `${this.icons.length} icons in assets/icon-images/` },
    );

    filtered(): typeof ICON_LIST {
        const kw = this.keyword().trim().toLowerCase();
        if (!kw) return this.icons;
        return this.icons.filter((i) => i.name.includes(kw));
    }

    totalPages(): number {
        return Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE));
    }

    paged(): typeof ICON_LIST {
        const idx = Math.min(this.pageIndex(), this.totalPages());
        const start = (idx - 1) * PAGE_SIZE;
        return this.filtered().slice(start, start + PAGE_SIZE);
    }

    onKeywordChange(value: string): void {
        this.keyword.set(value);
        this.pageIndex.set(1);
    }

    prevPage(): void {
        this.pageIndex.update((p) => Math.max(1, p - 1));
    }

    nextPage(): void {
        this.pageIndex.update((p) => Math.min(this.totalPages(), p + 1));
    }
}