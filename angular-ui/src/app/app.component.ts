import {
    ChangeDetectionStrategy,
    Component,
    DestroyRef,
    OnDestroy,
    OnInit,
    inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta } from '@angular/platform-browser';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';

import { environment } from '../environments/environment';
import { GIT_INFO } from '../generated/git-info';
import { BUILD_INFO } from '../generated/build-info';

/**
 * 根组件:仅承载 router-outlet,以及把当前路由路径同步到 body class。
 * standalone,使用 OnPush + zoneless。
 */
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy {
    private readonly meta = inject(Meta);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    private currentRouteClass = '';

    ngOnInit(): void {
        this.meta.updateTag({
            name: 'app-code-version',
            content: environment.codeVersion,
        });
        this.meta.updateTag({
            name: 'app-git-info',
            content: `branch=${GIT_INFO.branch}; commit=${GIT_INFO.commitId}; date=${GIT_INFO.date}`,
        });
        this.meta.updateTag({
            name: 'app-build-info',
            content: `buildTime=${BUILD_INFO.buildTime}; timestamp=${BUILD_INFO.timestamp}; buildUser=${BUILD_INFO.buildUser}; hostname=${BUILD_INFO.hostname}; platform=${BUILD_INFO.platform}; arch=${BUILD_INFO.arch}; osRelease=${BUILD_INFO.osRelease}; nodeVersion=${BUILD_INFO.nodeVersion}; npmVersion=${BUILD_INFO.npmVersion}; ci=${BUILD_INFO.ci}; ciName=${BUILD_INFO.ciName}`,
        });

        this.router.events
            .pipe(
                filter((event): event is NavigationEnd => event instanceof NavigationEnd),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe((event) => {
                const path = (event.urlAfterRedirects || '').split('?')[0];
                const className = path
                    .replace(/^\//, '')
                    .replace(/\/$/, '')
                    .replace(/\//g, '_')
                    .replace(/[^a-zA-Z0-9_-]/g, '')
                    .toLowerCase();
                this.setRouteClass(className ? `page-path-${className}` : '');
            });
    }

    ngOnDestroy(): void {
        this.clearRouteClass();
    }

    private setRouteClass(className: string): void {
        if (this.currentRouteClass) {
            document.body.classList.remove(this.currentRouteClass);
        }
        if (className) {
            document.body.classList.add(className);
        }
        this.currentRouteClass = className;
    }

    private clearRouteClass(): void {
        if (this.currentRouteClass) {
            document.body.classList.remove(this.currentRouteClass);
        }
        this.currentRouteClass = '';
    }
}