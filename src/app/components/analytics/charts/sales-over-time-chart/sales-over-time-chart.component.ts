import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {CurrencyPipe, NgClass, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {BubbleDataPoint, Chart, ChartTypeRegistry, Point, TooltipItem} from 'chart.js';
import {CurrencyService} from '../../../../services/currency.service';
import {AnalyticsData, ComparisonData} from '../../../../services/analytics.service';
import {FeatureAccessDirective} from '../../../../directives/feature-access.directive';

@Component({
  selector: 'app-sales-over-time-chart',
  templateUrl: './sales-over-time-chart.component.html',
  styleUrls: ['./sales-over-time-chart.component.css'],
  imports: [FormsModule, NgIf, NgClass, CurrencyPipe, FeatureAccessDirective],
  standalone: true
})
export class SalesOverTimeChartComponent implements OnInit, OnChanges, OnDestroy {
  // Make Math available in the template
  Math = Math;

  @Input() analyticsData: AnalyticsData | null = null;
  @Input() comparisonData: ComparisonData | null = null;
  @Input() enableComparison: boolean = false;
  @Input() enableForecasting: boolean = false;
  @Input() forecastPeriod: number = 30;
  @Input() forecastData: {revenue: {x: Date, y: number}[], profit: {x: Date, y: number}[]} | null = null;

  @Output() forecastingToggled = new EventEmitter<boolean>();
  @Output() forecastPeriodChanged = new EventEmitter<number>();

  salesChart: Chart | null = null;

  constructor(
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.initSalesChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-initialize chart when inputs change
    if (changes['analyticsData'] || changes['comparisonData'] ||
        changes['enableComparison'] || changes['enableForecasting'] ||
        changes['forecastPeriod'] || changes['forecastData']) {
      this.initSalesChart();
    }
  }

  ngOnDestroy(): void {
    // Destroy chart when component is destroyed
    if (this.salesChart) {
      this.salesChart.destroy();
    }
  }

  initSalesChart(): void {
    if (!this.analyticsData) return;

    // Destroy existing chart if it exists
    if (this.salesChart) {
      this.salesChart.destroy();
    }

    const ctx = document.getElementById('salesChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Convert current period data to {x, y} format for proper date handling
    const currentRevenueData = this.analyticsData.timeSeries.map(item => ({
      x: new Date(item.date),
      y: item.revenue
    }));

    const currentProfitData = this.analyticsData.timeSeries.map(item => ({
      x: new Date(item.date),
      y: item.profit
    }));

    // Create datasets array
    const datasets = [
      {
        label: 'Revenue',
        data: currentRevenueData,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(75, 192, 192)'
      },
      {
        label: 'Profit',
        data: currentProfitData,
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.1,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: 'rgb(153, 102, 255)'
      }
    ];

    // Add comparison data if available
    if (this.comparisonData && this.enableComparison) {
      // Convert previous period data to {x, y} format to ensure proper date alignment
      const previousRevenueData = this.comparisonData.previous.timeSeries.map(item => ({
        x: new Date(item.date),
        y: item.revenue
      }));

      const previousProfitData = this.comparisonData.previous.timeSeries.map(item => ({
        x: new Date(item.date),
        y: item.profit
      }));

      // Add previous period datasets with dashed lines
      // @ts-ignore
      datasets.push(
        {
          label: 'Previous Revenue',
          data: previousRevenueData,
          borderColor: 'rgb(75,91,192)',
          backgroundColor: 'rgba(75,91,192,0.1)',
          tension: 0.1,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: 'rgb(75,91,192)'
        },
        {
          label: 'Previous Profit',
          data: previousProfitData,
          borderColor: 'rgb(255,102,166)',
          backgroundColor: 'rgba(255,102,166, 0.1)',
          tension: 0.1,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: 'rgb(255,102,166)'
        }
      );
    }

    // Add forecast data if available and forecasting is enabled
    if (this.forecastData && this.enableForecasting) {
      // Add forecast datasets with dotted lines
      datasets.push(
        {
          label: 'Forecast Revenue',
          data: this.forecastData.revenue,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0)',
          tension: 0.1,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: 'rgb(75, 192, 192)'
        },
        {
          label: 'Forecast Profit',
          data: this.forecastData.profit,
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0)',
          tension: 0.1,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: 'rgb(153, 102, 255)'
        }
      );
    }

    // @ts-ignore
    this.salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'MMM d'
              }
            },
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value: string | number) => this.ticksCallback(value)
            }
          }
        },
        plugins: {
          tooltip: {
            mode: 'nearest',
            intersect: false,
            callbacks: {
              title: (tooltipItems: TooltipItem<any>[]) => {
                if (tooltipItems.length > 0) {
                  // Format the date for display
                  const date = new Date(tooltipItems[0].parsed.x);
                  return date.toLocaleDateString();
                }
                return '';
              },
              label: (context: TooltipItem<any>) => {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += this.currencyService.getCurrencySymbol() + context.parsed.y.toFixed(2);
                }
                return label;
              }
            }
          },
          legend: {
            labels: {
              usePointStyle: true,
              generateLabels: (chart: Chart<keyof ChartTypeRegistry, (number | [number, number] | Point | BubbleDataPoint | null)[], unknown>) => {
                return Chart.defaults.plugins.legend.labels.generateLabels(chart);
              }
            }
          }
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        }
      }
    });
  }

  ticksCallback(value: string | number): string {
    return this.currencyService.getCurrencySymbol() + value;
  }

  /**
   * Calculate the total value of forecast data
   * @param forecastData Array of forecast data points
   * @returns Total forecast value
   */
  getTotalForecastValue(forecastData: {x: Date, y: number}[]): number {
    if (!forecastData || forecastData.length === 0) return 0;
    return forecastData.reduce((sum, item) => sum + item.y, 0);
  }

  /**
   * Calculate the trend percentage of forecast data
   * @param forecastData Array of forecast data points
   * @returns Trend percentage (positive for upward trend, negative for downward trend)
   */
  getForecastTrend(forecastData: {x: Date, y: number}[]): number {
    if (!forecastData || forecastData.length < 2) return 0;

    // Get first and last data points
    const firstValue = forecastData[0].y;
    const lastValue = forecastData[forecastData.length - 1].y;

    // Calculate percentage change
    if (firstValue === 0) return lastValue > 0 ? 100 : 0;

    return ((lastValue - firstValue) / firstValue) * 100;
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
    csvContent += 'Date,Sales Count,Revenue,Profit\n';

    // Add data rows
    this.analyticsData.timeSeries.forEach(item => {
      csvContent += `${item.date},${item.count},${item.revenue},${item.profit}\n`;
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

  /**
   * Toggle forecasting on/off
   */
  toggleForecasting(): void {
    // Emit an event to the parent component
    this.forecastingToggled.emit(!this.enableForecasting);
  }

  /**
   * Gets the current currency code from the CurrencyService
   */
  getCurrencyCode(): string {
    const currencySymbol = this.currencyService.getCurrencySymbol();
    const currencyOption = this.currencyService.getCurrencyBySymbol(currencySymbol);
    return currencyOption?.code || 'GBP';
  }
}
