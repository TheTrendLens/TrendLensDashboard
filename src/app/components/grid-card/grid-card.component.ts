// grid-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridModule } from 'ag-grid-angular';

@Component({
  selector: 'app-grid-card',
  standalone: true,
  imports: [CommonModule, AgGridModule],
  template: `
    <div class="card surface-card text-500 flex justify-content-between pt-4 h-100 box-shadow">
      <div class="flex justify-content-center align-items-center">
        <h1 class="m-0 mb-1 text-500 text-center">{{ title }}</h1>
        <span *ngIf="showActionBadge"
              class="badge rounded-pill bg-warning text-dark">
          Action Required
        </span>
      </div>
      <ag-grid-angular
        class="ag-theme-quartz grid"
        [rowData]="rowData"
        [gridOptions]="gridOptions">
      </ag-grid-angular>
    </div>
  `,
  styles: [`
    .grid {
      height: 500px;
    }
  `]
})
export class GridCardComponent {
  @Input() title: string = '';
  @Input() showActionBadge: boolean = false;
  @Input() gridOptions: any;
  @Input() rowData: any[] = [];
}
