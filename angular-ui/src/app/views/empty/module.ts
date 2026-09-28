import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmptyComponent } from './component';
import { EmptyRoutingModule } from './routing.module';

@NgModule({
    declarations: [EmptyComponent],
    imports: [CommonModule, FormsModule, EmptyRoutingModule],
})
export class EmptyModule {}
