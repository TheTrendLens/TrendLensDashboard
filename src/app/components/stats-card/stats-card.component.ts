// stats-card.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card surface-card text-500 flex justify-content-between pt-4 h-100 box-shadow">
      <div class="stats-content">
        <h3 class="m-0 mb-1 text-500">{{ title }}</h3>
        <h1 class="m-0 text-500">{{ value }}</h1>
      </div>
    </div>
  `,
  styles: [`
    .stats-content {
      box-sizing: border-box;
    }
  `]
})
export class StatsCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
}
