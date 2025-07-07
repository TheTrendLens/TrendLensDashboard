import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { NgIf, NgForOf, NgClass, CurrencyPipe } from '@angular/common';
import { Chart, TooltipItem } from 'chart.js';
import { CurrencyService } from '../../../../services/currency.service';
import { AnalyticsData } from '../../../../services/analytics.service';

@Component({
  selector: 'app-category-chart',
  templateUrl: './category-chart.component.html',
  styleUrls: ['./category-chart.component.css'],
  standalone: true
})
export class CategoryChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() analyticsData: AnalyticsData | null = null;
  @Output() categorySelected = new EventEmitter<string>();

  categoryChart: Chart | null = null;

  constructor(
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.initCategoryChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-initialize chart when inputs change
    if (changes['analyticsData']) {
      this.initCategoryChart();
    }
  }

  ngOnDestroy(): void {
    // Destroy chart when component is destroyed
    if (this.categoryChart) {
      this.categoryChart.destroy();
    }
  }

  initCategoryChart(): void {
    if (!this.analyticsData) return;

    // Destroy existing chart if it exists
    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    const ctx = document.getElementById('categoryChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Get top 5 categories by count
    const topCategories = this.analyticsData.categories
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const labels = topCategories.map(item => item.category);
    const countData = topCategories.map(item => item.count);
    const revenueData = topCategories.map(item => item.revenue);

    this.categoryChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Sales Count',
            data: countData,
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 1,
            hoverOffset: 10
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event: any, elements: string | any[]) => {
          if (elements && elements.length > 0) {
            const index = elements[0].index;
            const category = labels[index];
            // Emit the selected category to the parent component
            this.categorySelected.emit(category);
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<any>) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const revenue = revenueData[context.dataIndex];

                return [
                  `${label}: ${value} sales`,
                  `Revenue: ${this.currencyService.getCurrencySymbol()}${revenue.toFixed(2)}`,
                  `Click to filter by this category`
                ];
              }
            }
          }
        }
      }
    });
  }

  /**
   * Export chart as image
   * @param chartId The ID of the chart canvas element
   * @param fileName The name of the file to download
   */
  exportChartAsImage(chartId: string, fileName: string): void {
    const canvas = document.getElementById(chartId) as HTMLCanvasElement;
    if (!canvas) return;

    // Create a temporary link element
    const link = document.createElement('a');
    link.download = `${fileName}-${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  /**
   * Export data as CSV
   * @param fileName The name of the file to download
   */
  exportDataAsCSV(fileName: string): void {
    if (!this.analyticsData) return;

    let csvContent = 'data:text/csv;charset=utf-8,';

    // Add header row
    csvContent += 'Category,Sales Count,Revenue,Profit,Profit Margin (%),Avg Days to Sell\n';

    // Add data rows
    this.analyticsData.categories.forEach(item => {
      const profitMargin = item.profitMargin !== undefined ? item.profitMargin.toFixed(1) : 'N/A';
      const avgTurnover = item.averageTurnover !== undefined ? item.averageTurnover.toFixed(1) : 'N/A';
      csvContent += `${item.category},${item.count},${item.revenue},${item.profit || 0},${profitMargin},${avgTurnover}\n`;
    });

    // Create a temporary link element
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${fileName}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
