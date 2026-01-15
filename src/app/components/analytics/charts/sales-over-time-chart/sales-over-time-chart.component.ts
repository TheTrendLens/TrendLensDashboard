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

  /**
   * Aggregates time series data based on the specified time unit
   * @param timeSeries The original time series data
   * @param timeUnit The time unit to aggregate by ('day', 'month', 'year')
   * @returns Aggregated time series data
   */
  aggregateTimeSeriesData(timeSeries: {x: Date, y: number}[], timeUnit: string): {x: Date, y: number}[] {
    if (timeUnit === 'day') {
      // No aggregation needed for daily data
      return timeSeries;
    }

    // Create a map to store aggregated data
    const aggregatedData = new Map<string, {date: Date, total: number}>();

    // Aggregate data based on time unit
    timeSeries.forEach(item => {
      const date = item.x;
      let key: string;

      if (timeUnit === 'month') {
        // Group by year and month
        key = `${date.getFullYear()}-${date.getMonth()}`;
      } else { // year
        // Group by year
        key = `${date.getFullYear()}`;
      }

      if (aggregatedData.has(key)) {
        // Add to existing entry
        aggregatedData.get(key)!.total += item.y;
      } else {
        // Create new entry
        let aggregatedDate: Date;
        if (timeUnit === 'month') {
          // Set to first day of month
          aggregatedDate = new Date(date.getFullYear(), date.getMonth(), 1);
        } else { // year
          // Set to first day of year
          aggregatedDate = new Date(date.getFullYear(), 0, 1);
        }
        aggregatedData.set(key, {date: aggregatedDate, total: item.y});
      }
    });

    // Convert map back to array
    return Array.from(aggregatedData.values()).map(item => ({
      x: item.date,
      y: item.total
    })).sort((a, b) => a.x.getTime() - b.x.getTime()); // Sort by date
  }

  initSalesChart(): void {
    if (!this.analyticsData) return;

    // Destroy existing chart if it exists
    if (this.salesChart) {
      this.salesChart.destroy();
    }

    const ctx = document.getElementById('salesChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Calculate date range in days
    const dateRange = (new Date(this.analyticsData.timeSeries[this.analyticsData.timeSeries.length - 1].date).getTime() -
      new Date(this.analyticsData.timeSeries[0].date).getTime()) / (1000 * 60 * 60 * 24);

    // Determine time unit based on date range
    let timeUnit = 'day';
    if (dateRange > 365) {
      timeUnit = 'year';
    } else if (dateRange >= 32) {
      timeUnit = 'month';
    }

    // Convert current period data to {x, y} format for proper date handling
    const rawRevenueData = this.analyticsData.timeSeries.map(item => ({
      x: new Date(item.date),
      y: item.revenue
    }));

    const rawProfitData = this.analyticsData.timeSeries.map(item => ({
      x: new Date(item.date),
      y: item.profit
    }));

    // Aggregate data based on time unit
    const currentRevenueData = this.aggregateTimeSeriesData(rawRevenueData, timeUnit);
    const currentProfitData = this.aggregateTimeSeriesData(rawProfitData, timeUnit);

    // Create datasets array
    const datasets = [
      {
        label: 'Revenue',
        data: currentRevenueData,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderWidth: 1,
        barPercentage: 0.8,
        categoryPercentage: 0.9
      },
      {
        label: 'Profit',
        data: currentProfitData,
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderWidth: 1,
        barPercentage: 0.8,
        categoryPercentage: 0.9
      }
    ];

    // Add comparison data if available
    if (this.comparisonData && this.enableComparison) {

      // Convert previous period data to {x, y} format with normalized dates
      const rawPreviousRevenueData = this.comparisonData.previous.timeSeries.map((item, index) => {
        const itemDate = new Date(item.date);
        // @ts-ignore
        const currentDate = new Date(this.analyticsData.timeSeries[Math.min(index, this.analyticsData.timeSeries.length - 1)].date);

        // Create a normalized date based on the time unit
        let normalizedDate;
        if (timeUnit === 'day') {
          // Keep the day, but use month/year from current period
          normalizedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), itemDate.getDate());
        } else if (timeUnit === 'month') {
          // Keep the month, but use year from current period
          normalizedDate = new Date(currentDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        } else {
          // Use the date as is for year comparison
          normalizedDate = itemDate;
        }

        return {
          x: normalizedDate,
          y: item.revenue
        };
      });

      const rawPreviousProfitData = this.comparisonData.previous.timeSeries.map((item, index) => {
        const itemDate = new Date(item.date);
        // @ts-ignore
        const currentDate = new Date(this.analyticsData.timeSeries[Math.min(index, this.analyticsData.timeSeries.length - 1)].date);

        // Create a normalized date based on the time unit
        let normalizedDate;
        if (timeUnit === 'day') {
          // Keep the day, but use month/year from current period
          normalizedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), itemDate.getDate());
        } else if (timeUnit === 'month') {
          // Keep the month, but use year from current period
          normalizedDate = new Date(currentDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
        } else {
          // Use the date as is for year comparison
          normalizedDate = itemDate;
        }

        return {
          x: normalizedDate,
          y: item.profit
        };
      });

      // Aggregate previous period data based on time unit
      const previousRevenueData = this.aggregateTimeSeriesData(rawPreviousRevenueData, timeUnit);
      const previousProfitData = this.aggregateTimeSeriesData(rawPreviousProfitData, timeUnit);

      // Add previous period datasets
      // @ts-ignore
      datasets.push(
        {
          label: 'Previous Revenue',
          data: previousRevenueData,
          borderColor: 'rgb(75,91,192)',
          backgroundColor: 'rgba(75,91,192,0.4)',
          borderWidth: 1,
          barPercentage: 0.8,
          categoryPercentage: 0.9
        },
        {
          label: 'Previous Profit',
          data: previousProfitData,
          borderColor: 'rgb(255,102,166)',
          backgroundColor: 'rgba(255,102,166, 0.4)',
          borderWidth: 1,
          barPercentage: 0.8,
          categoryPercentage: 0.9
        }
      );
    }

    // Add forecast data if available and forecasting is enabled
    if (this.forecastData && this.enableForecasting) {
      // Aggregate forecast data based on time unit
      const forecastRevenueData = this.aggregateTimeSeriesData(this.forecastData.revenue, timeUnit);
      const forecastProfitData = this.aggregateTimeSeriesData(this.forecastData.profit, timeUnit);

      // Add forecast datasets
      datasets.push(
        {
          label: 'Forecast Revenue',
          data: forecastRevenueData,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.3)',
          borderWidth: 1,
          // @ts-ignore
          borderDash: [5, 5],
          barPercentage: 0.8,
          categoryPercentage: 0.9
        },
        {
          label: 'Forecast Profit',
          data: forecastProfitData,
          borderColor: 'rgb(153, 102, 255)',
          backgroundColor: 'rgba(153, 102, 255, 0.3)',
          borderWidth: 1,
          borderDash: [5, 5],
          barPercentage: 0.8,
          categoryPercentage: 0.9
        }
      );
    }

    // @ts-ignore
    this.salesChart = new Chart(ctx, {
      type: 'bar',
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
              unit: timeUnit,
              displayFormats: {
                day: 'MMM d',
                month: 'MMM yyyy',
                year: 'yyyy'
              }
            },
            title: {
              display: true,
              text: 'Date'
            },
            // Set min and max to prevent extra month at the end of the year
            min: currentRevenueData.length > 0 ? currentRevenueData[0].x : undefined,
            max: currentRevenueData.length > 0 ? currentRevenueData[currentRevenueData.length - 1].x : undefined
          },
          y: {
            beginAtZero: true,
            stacked: false,
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
      const revenue = item.revenue !== undefined ? item.revenue.toFixed(2) : '0.00';
      const profit = item.profit !== undefined ? item.profit.toFixed(2) : '0.00';
      csvContent += `${item.date},${item.count},${revenue},${profit}\n`;
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
