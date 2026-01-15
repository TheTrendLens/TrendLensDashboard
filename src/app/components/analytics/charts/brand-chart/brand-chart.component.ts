import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { NgIf, NgForOf, NgClass, CurrencyPipe } from '@angular/common';
import { Chart, TooltipItem } from 'chart.js';
import { CurrencyService } from '../../../../services/currency.service';
import { AnalyticsData } from '../../../../services/analytics.service';

@Component({
  selector: 'app-brand-chart',
  templateUrl: './brand-chart.component.html',
  styleUrls: ['./brand-chart.component.css'],
  standalone: true
})
export class BrandChartComponent implements OnInit, OnChanges, OnDestroy {
  @Input() analyticsData: AnalyticsData | null = null;
  @Output() brandSelected = new EventEmitter<string>();

  brandChart: Chart | null = null;

  constructor(
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.initBrandChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-initialize chart when inputs change
    if (changes['analyticsData']) {
      this.initBrandChart();
    }
  }

  ngOnDestroy(): void {
    // Destroy chart when component is destroyed
    if (this.brandChart) {
      this.brandChart.destroy();
    }
  }

  initBrandChart(): void {
    if (!this.analyticsData) return;

    // Destroy existing chart if it exists
    if (this.brandChart) {
      this.brandChart.destroy();
    }

    const ctx = document.getElementById('brandChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Get top 5 brands by revenue
    const topBrands = this.analyticsData.brands
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const labels = topBrands.map(item => item.brand);
    const revenueData = topBrands.map(item => item.revenue);
    const countData = topBrands.map(item => item.count);

    this.brandChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Revenue',
            data: revenueData,
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
            const brand = labels[index];
            // Emit the selected brand to the parent component
            this.brandSelected.emit(brand);
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context: TooltipItem<any>) => {
                const label = context.label || '';
                const value = context.parsed || 0;
                const count = countData[context.dataIndex];

                return [
                  `${label}`,
                  `Revenue: ${this.currencyService.getCurrencySymbol()}${value.toFixed(2)}`,
                  `Sales: ${count}`,
                  `Click to filter by this brand`
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
    csvContent += 'Brand,Sales Count,Revenue,Profit,Profit Margin (%),Avg Days to Sell\n';

    // Add data rows
    this.analyticsData.brands.forEach(item => {
      const profitMargin = item.profitMargin !== undefined ? item.profitMargin.toFixed(1) : 'N/A';
      const avgTurnover = item.averageTurnover !== undefined ? item.averageTurnover.toFixed(1) : 'N/A';
      const revenue = item.revenue !== undefined ? item.revenue.toFixed(2) : '0.00';
      const profit = item.profit !== undefined ? item.profit.toFixed(2) : '0.00';
      csvContent += `${item.brand},${item.count},${revenue},${profit},${profitMargin},${avgTurnover}\n`;
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
