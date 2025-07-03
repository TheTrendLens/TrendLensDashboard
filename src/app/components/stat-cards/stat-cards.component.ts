import {Component, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {take} from 'rxjs';
import { UserService } from '../../services/user.service';
import {NgClass, NgForOf, CurrencyPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {BaseChartDirective} from 'ng2-charts';
import {Chart, ChartData, ChartDataset, ChartOptions, registerables, TooltipItem} from 'chart.js';
import TrendlineLinearPlugin from 'chartjs-plugin-trendline';
import 'chartjs-adapter-date-fns';
import { CurrencyService } from '../../services/currency.service';

Chart.register(...registerables);
Chart.register(TrendlineLinearPlugin);

@Component({
  selector: 'app-stat-cards',
  imports: [
    NgForOf,
    FormsModule,
    NgClass,
    BaseChartDirective,
    CurrencyPipe
  ],
  templateUrl: './stat-cards.component.html',
  styleUrl: './stat-cards.component.css'
})
export class StatCardsComponent implements OnInit {

  metrics: {
    revenue: number;
    costs: number;
    profit: number;
    numberOfSales: number;
  } = {
    revenue: 0,
    costs: 0,
    profit: 0,
    numberOfSales: 0
  };

  timeframeOptions = [
    { label: 'This Year', value: 'year' },
    { label: 'This Month', value: 'month' },
    // { label: 'Last 30 Days', value: '30days' },
    { label: 'Last Year', value: 'lastyear' },
    { label: 'Last Month', value: 'lastmonth' },
  ];

  @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>;

  public chartData: ChartData = {
    labels: [],
    datasets: []
  };

  public barChartData: ChartData = {
    labels: [],
    datasets: []
  };

  public chartOptions: ChartOptions = {
    elements: {
      line: {
        tension: .3,
      },
      point: {
        radius: 0 // Hide points to improve performance
      }
    },
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: (value: any, index: any, ticks: any) => {
            return this.currencyService.getCurrencySymbol() + value.toFixed(2);
          }
        }
      },
      x: {
        type: 'timeseries',
        time: {
          unit: 'month',
          displayFormats: {
            day: 'MMM d',
            month: 'MMM yyyy'
          }
        },
        ticks: {
          source: 'data',
          autoSkip: false,
          stepSize: 1
        },
        bounds: 'ticks',
      }
    },
    plugins: {
      filler: {
        propagate: true
      },
      tooltip: {
        mode: 'index',
        callbacks: {
          title: (tooltipItems: TooltipItem<any>[]) => {
            // Format the date without time
            if (tooltipItems.length > 0) {
              const item = tooltipItems[0];
              const date = new Date(item.parsed.x);
              return date.toLocaleDateString();
            }
            return '';
          },
          label: (value: TooltipItem<any>) => {
            if (typeof value.raw === "number") {
              let numberValue: number = value.raw;
              return this.currencyService.getCurrencySymbol() + numberValue.toFixed(2);
            }

            return value.formattedValue;
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

  public barChartOptions: ChartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any, index: any, ticks: any) {
            if (Math.floor(value) === value) {
              return value;
            }
          }
        }
      },
      x: {
        type: 'timeseries',
        time: {
          unit: 'month',
          displayFormats: {
            day: 'MMM d',
            month: 'MMM yyyy'
          }
        },
        ticks: {
          source: 'labels',
          autoSkip: false,
          stepSize: 1
        },
        bounds: 'ticks',
      }
    },
    plugins: {
      tooltip: {
        mode: 'index',
        callbacks: {
          title: (tooltipItems: TooltipItem<any>[]) => {
            // Format the date without time
            if (tooltipItems.length > 0) {
              const item = tooltipItems[0];
              const date = new Date(item.parsed.x);
              return date.toLocaleDateString();
            }
            return '';
          }
        }
      }
    }
  }

  selectedTimeframe = this.timeframeOptions[0].value;

  constructor(
    private userService: UserService,
    private currencyService: CurrencyService
  ) {

  }

  ngOnInit(): void {
    this.updateStats();
  }

  public updateStats() {
    // Get metrics with filterMissingCosts=true to only include sales with complete cost data
    this.userService.getMetrics(this.selectedTimeframe, true).pipe(take(1)).subscribe({
      next: (metrics) => {
        this.metrics = metrics;
      },
      error: (error) => {
        console.error(error);
      }
    });


    // Get graphable metrics with filterMissingCosts=true to only include sales with complete cost data
    this.userService.getGraphableMetrics(this.selectedTimeframe, true).pipe(take(1)).subscribe({
      next: (metrics) => {
        // Set labels based on date range
        this.chartData.labels = metrics.labels;
        this.barChartData.labels = metrics.labels;

        // Update chart datasets
        this.chartData.datasets = metrics.series.filter((series) => series.label == 'Profit' || series.label == 'Costs').map((series) => ({
          label: series.label,
          data: series.data,
          borderColor: series.borderColor,
          backgroundColor: series.borderColor.replace('1)', '0.2)'),
          pointStyle: false,
          borderWidth: 2,
          stack: '0',
          fill: {
            target: series.label === 'Costs' ? 'origin' : '-1',
            color: series.borderColor
          }
        }));

        this.barChartData.datasets = metrics.series.filter((series) => series.label == 'Number of Sales').map((series) => ({
          label: series.label,
          data: series.data,
          borderColor: series.borderColor,
          backgroundColor: series.borderColor.replace('1)', '0.2)'),
          pointStyle: false,
          borderWidth: 2,
          trendlineLinear: {
            colorMin: "rgba(255,105,180, .8)",
            lineStyle: "dotted",
            width: 2
          }
        }));

        // Determine the format based on the selected timeframe
        let xAxisFormat: 'day' | 'month';

        if (this.selectedTimeframe === 'month' || this.selectedTimeframe === 'lastmonth') {
          xAxisFormat = 'day';
        } else {
          // For 'year', 'lastyear', or any other timeframe
          xAxisFormat = 'month';
        }

        // Update chart options with the appropriate format
        this.updateChartOptions(xAxisFormat);

        // Force a complete update of all charts
        setTimeout(() => {
          this.charts.forEach((child) => {
            if (child.chart) {
              child.chart.update('reset');
            }
          });
        }, 0);
      },
      error: (error) => {
        console.error(error);
      }
    });
  }

  selectTimeframe(timeframe: string): void {
    this.selectedTimeframe = timeframe;
    this.updateStats();
  }

  /**
   * Check if all dates in the labels array are within the same month
   */
  private areDatesInSameMonth(labels: string[]): boolean {
    if (labels.length <= 1) return true;

    try {
      // Try to parse the first date to determine format
      const firstDate = new Date(labels[0]);
      const firstMonth = firstDate.getMonth();
      const firstYear = firstDate.getFullYear();

      // Check if all dates are in the same month and year
      return labels.every(label => {
        const date = new Date(label);
        return date.getMonth() === firstMonth && date.getFullYear() === firstYear;
      });
    } catch (e) {
      console.error('Error parsing dates:', e);
      return false;
    }
  }

  /**
   * Check if all dates in the labels array are within the same year
   */
  private areDatesInSameYear(labels: string[]): boolean {
    if (labels.length <= 1) return true;

    try {
      // Try to parse the first date to determine format
      const firstDate = new Date(labels[0]);
      const firstYear = firstDate.getFullYear();

      // Check if all dates are in the same year
      return labels.every(label => {
        const date = new Date(label);
        return date.getFullYear() === firstYear;
      });
    } catch (e) {
      console.error('Error parsing dates:', e);
      return false;
    }
  }

  /**
   * Update chart options based on the date format needed
   */
  private updateChartOptions(format: 'day' | 'month'): void {
    // Create time scale configuration
    const timeScale = this.createTimeScale(format);

    // Update line chart options - create a new object to ensure changes are applied
    this.chartOptions = {
      ...this.chartOptions,
      scales: {
        ...this.chartOptions.scales,
        x: timeScale
      }
    } as any; // Type assertion until we properly define scales

    // Update bar chart options - create a new object to ensure changes are applied
    this.barChartOptions = {
      ...this.barChartOptions,
      scales: {
        ...this.barChartOptions.scales,
        x: timeScale
      }
    } as any; // Type assertion until we properly define scales
  }


  /**
   * Creates a time scale configuration for chart x-axis
   * @param format The time unit format ('day' or 'month')
   * @returns Time scale configuration object
   */
  private createTimeScale(format: 'day' | 'month'): any {
    const now = new Date();
    let min: Date | undefined = undefined;
    let max: Date | undefined = undefined;

    // Set min and max dates based on the selected timeframe
    if (format === 'month') {
      if (this.selectedTimeframe === 'year') {
        // This year: Jan 1 to Dec 31
        min = new Date(now.getFullYear(), 0, 1);
        max = new Date(now.getFullYear(), 11, 31);
      } else if (this.selectedTimeframe === 'lastyear') {
        // Last year: Jan 1 to Dec 31 of last year
        min = new Date(now.getFullYear() - 1, 0, 1);
        max = new Date(now.getFullYear() - 1, 11, 31);
      }
    } else if (format === 'day') {
      if (this.selectedTimeframe === 'month') {
        // This month: 1st to last day of current month
        min = new Date(now.getFullYear(), now.getMonth(), 1);
        max = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
      } else if (this.selectedTimeframe === 'lastmonth') {
        // Last month: 1st to last day of previous month
        min = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        max = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
      }
    }

    return {
      type: 'timeseries',
      time: {
        unit: format,
        displayFormats: {
          day: 'MMM d',
          month: 'MMM yyyy'
        }
      },
      min: min,
      max: max,
      ticks: {
        source: 'ticks',
        autoSkip: false,
        stepSize: 1
      },
      bounds: 'ticks',
      distribution: 'linear'
    };
  }

  /**
   * Gets the current currency code from the CurrencyService
   * This is used by the CurrencyPipe in the template
   */
  getCurrencyCode(): string {
    const currencySymbol = this.currencyService.getCurrencySymbol();
    const currencyOption = this.currencyService.getCurrencyBySymbol(currencySymbol);
    return currencyOption?.code || 'GBP';
  }
}
