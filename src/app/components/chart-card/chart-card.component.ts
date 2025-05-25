// chart-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AgChartsModule } from 'ag-charts-angular';

@Component({
  selector: 'app-chart-card',
  standalone: true,
  imports: [CommonModule, AgChartsModule],
  template: `
    <div class="card surface-card text-500 flex justify-content-between pt-4 box-shadow">
      <ag-charts
        [options]="options"
        class="chart">
      </ag-charts>
    </div>
  `,
  styles: [`
    .chart {
      height: 150px;
    }
  `]
})
export class ChartCardComponent {
  @Input() options: any;
}
