import {Component, OnInit, QueryList, ViewChildren, signal, inject, ChangeDetectionStrategy} from '@angular/core';
import {take} from 'rxjs';
import { UserService } from '../../services/user.service';
import {CurrencyPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {BaseChartDirective} from 'ng2-charts';
import {Chart, ChartData, ChartOptions, registerables, TooltipItem} from 'chart.js';
import TrendlineLinearPlugin from 'chartjs-plugin-trendline';
import 'chartjs-adapter-date-fns';
import { CurrencyService } from '../../services/currency.service';

Chart.register(...registerables);
Chart.register(TrendlineLinearPlugin);

@Component({
  selector: 'app-stat-cards',
  imports: [
    FormsModule,
    BaseChartDirective,
    CurrencyPipe
  ],
  templateUrl: './stat-cards.component.html',
  styleUrl: './stat-cards.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatCardsComponent implements OnInit {
  private userService = inject(UserService);
  private currencyService = inject(CurrencyService);

  metrics = signal<{
    revenue: number;
    costs: number;
    profit: number;
    numberOfSales: number;
    roi: number;
    averageProfit: number;
    salesTax?: number;
  }>({
    revenue: 0,
    costs: 0,
    profit: 0,
    numberOfSales: 0,
    roi: 0,
    averageProfit: 0,
  });

  showSalesTaxEnabled = signal<boolean>(false);

  timeframeOptions = [
    { label: 'This Year', value: 'year' },
    { label: 'This Month', value: 'month' },
    { label: 'Last Year', value: 'lastyear' },
    { label: 'Last Month', value: 'lastmonth' },
  ];

  @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>;

  public chartData = signal<ChartData>({
    labels: [],
    datasets: []
  });

  public barChartData = signal<ChartData>({
    labels: [],
    datasets: []
  });

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
          callback: (value: any) => {
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
        bounds: 'data',
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
          callback: function(value: any) {
            if (Math.floor(value) === value) {
              return value;
            }
            return '';
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
        bounds: 'data',
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

  selectedTimeframe = signal<string>(this.timeframeOptions[0].value);

  ngOnInit(): void {
    // React to user preference changes for showing sales tax
    this.userService.isShowSalesTaxEnabled().subscribe((enabled) => {
      this.showSalesTaxEnabled.set(enabled);
      this.updateStats();
    });
    this.updateStats();
  }

  public updateStats() {
    // Get metrics with filterMissingCosts=true to only include sales with complete cost data
    const includeTax = this.userService.getShowSalesTaxEnabled();
    this.userService.getMetrics(this.selectedTimeframe(), false, includeTax).pipe(take(1)).subscribe({
      next: (metrics) => {
        this.metrics.set({
          revenue: metrics.revenue,
          costs: metrics.costs,
          profit: metrics.profit,
          numberOfSales: metrics.numberOfSales,
          roi: metrics.roi,
          averageProfit: metrics.averageProfit,
          salesTax: metrics.salesTax ?? undefined,
        });
      },
      error: (error) => {
        console.error(error);
      }
    });


    // Get graphable metrics with filterMissingCosts=true to only include sales with complete cost data
    this.userService.getGraphableMetrics(this.selectedTimeframe(), false, includeTax).pipe(take(1)).subscribe({
      next: (metrics) => {
        // Set labels based on date range
        const labels = metrics.labels;

        // Update chart datasets
        const newChartData: ChartData = {
          labels: labels,
          datasets: metrics.series
            .filter((series: any) => ['Profit', 'Costs', 'Sales Tax'].includes(series.label))
            .map((series: any) => ({
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
            }))
        };
        this.chartData.set(newChartData);

        const newBarChartData: ChartData = {
          labels: labels,
          datasets: metrics.series.filter((series: any) => series.label == 'Number of Sales').map((series: any) => ({
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
          }))
        };
        this.barChartData.set(newBarChartData);

        // Determine the format based on the selected timeframe
        let xAxisFormat: 'day' | 'month';

        if (this.selectedTimeframe() === 'month' || this.selectedTimeframe() === 'lastmonth') {
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
    this.selectedTimeframe.set(timeframe);
    this.updateStats();
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


  private createTimeScale(format: 'day' | 'month'): any {
    const now = new Date();
    let min: Date | undefined = undefined;
    let max: Date | undefined = undefined;

    // Set min and max dates based on the selected timeframe
    if (format === 'month') {
      if (this.selectedTimeframe() === 'year') {
        // This year: Jan 1 to current month (not beyond current month)
        min = new Date(now.getFullYear(), 0, 1);
        max = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
      } else if (this.selectedTimeframe() === 'lastyear') {
        // Last year: Jan 1 to Dec 1 of last year (not Dec 31st to avoid duplicate)
        min = new Date(now.getFullYear() - 1, 0, 1);
        max = new Date(now.getFullYear() - 1, 11, 1); // December 1st of last year
      }
    } else if (format === 'day') {
      if (this.selectedTimeframe() === 'month') {
        // This month: 1st to current day (not beyond current day)
        min = new Date(now.getFullYear(), now.getMonth(), 1);
        max = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Current day
      } else if (this.selectedTimeframe() === 'lastmonth') {
        // Last month: 1st to last day of previous month
        min = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        max = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
      }
    }

    const currentChartData = this.chartData();
    // If we have chart data but no min/max set yet, use the data range
    if ((!min || !max) && currentChartData.labels && currentChartData.labels.length > 0) {
      // Get the first and last dates from the labels
      const firstLabel = currentChartData.labels[0];
      const lastLabel = currentChartData.labels[currentChartData.labels.length - 1];

      // Only set if we don't already have values
      if (!min && firstLabel) {
        min = new Date(firstLabel.toString());
      }
      if (!max && lastLabel) {
        const dataMax = new Date(lastLabel.toString());
        // Ensure we don't go beyond the current date
        if (format === 'day') {
          max = dataMax > now ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : dataMax;
        } else if (format === 'month') {
          const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          max = dataMax > currentMonth ? currentMonth : dataMax;
        }
      }
    }

    const currentBarChartData = this.barChartData();
    // If we still don't have min/max and have bar chart data, use that range
    if ((!min || !max) && currentBarChartData.labels && currentBarChartData.labels.length > 0) {
      // Get the first and last dates from the bar chart labels
      const firstLabel = currentBarChartData.labels[0];
      const lastLabel = currentBarChartData.labels[currentBarChartData.labels.length - 1];

      // Only set if we don't already have values
      if (!min && firstLabel) {
        min = new Date(firstLabel.toString());
      }
      if (!max && lastLabel) {
        const dataMax = new Date(lastLabel.toString());
        // Ensure we don't go beyond the current date
        if (format === 'day') {
          max = dataMax > now ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : dataMax;
        } else if (format === 'month') {
          const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          max = dataMax > currentMonth ? currentMonth : dataMax;
        }
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
        source: 'data',
        autoSkip: false,
        stepSize: 1
      },
      bounds: 'data',
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
