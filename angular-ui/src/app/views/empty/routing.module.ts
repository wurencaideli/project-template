import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmptyComponent } from './component';

const routes = [
    {
        path: '',
        component: EmptyComponent,
    },
];
const routing: any = RouterModule.forChild(<Routes>routes);

@NgModule({
    imports: [routing],
    exports: [RouterModule],
})
export class EmptyRoutingModule {}
