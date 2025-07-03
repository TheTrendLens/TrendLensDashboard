import {Component, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {take} from 'rxjs';
import { UserService } from '../../services/user.service';
import {NgClass, NgForOf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {BaseChartDirective} from 'ng2-charts';
import {Chart, ChartData, ChartDataset, ChartOptions, registerables, TooltipItem} from 'chart.js';
import TrendlineLinearPlugin from 'chartjs-plugin-trendline';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables);
Chart.register(TrendlineLinearPlugin);

@Component({
  selector: 'app-stat-cards',
  imports: [
    NgForOf,
    FormsModule,
    NgClass,
    BaseChartDirective
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
      }
    },
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: function(value: any, index: any, ticks: any) {
            return '£' + value.toFixed(2);
          }
        }
      }
    },
    plugins: {
      filler: {
        propagate: true
      },
      tooltip: {
        mode: 'index',
        callbacks: {
          label: function(value: TooltipItem<any>) {
            if (typeof value.raw === "number") {
              let numberValue: number = value.raw;
              return '£' + numberValue.toFixed(2);
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

  public barChartOptions = {
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
      }
    }
  }

  selectedTimeframe = this.timeframeOptions[0].value;

  constructor(private userService: UserService) {

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

        // Determine if we need day or month labels based on the date range
        if (metrics.labels.length > 0) {
          const allDatesInSameMonth = this.areDatesInSameMonth(metrics.labels);
          const allDatesInSameYear = this.areDatesInSameYear(metrics.labels);

          // Update x-axis format based on date range
          const xAxisFormat = allDatesInSameMonth ? 'day' : (allDatesInSameYear ? 'month' : 'month');

          // Update chart options with the appropriate format
          this.updateChartOptions(xAxisFormat);
        }

        this.charts.forEach((child) => {
          if (child.chart)
            child.chart.update()
        });
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
    // Update line chart options
    this.chartOptions.scales = {
      ...this.chartOptions.scales,
      x: {
        type: 'time',
        time: {
          unit: format,
          displayFormats: {
            day: 'MMM d',
            month: 'MMM yyyy'
          }
        }
      }
    };

    // Update bar chart options
    this.barChartOptions = {
      ...this.barChartOptions,
      scales: {
        ...this.barChartOptions.scales,
        x: {
          type: 'time',
          time: {
            unit: format,
            displayFormats: {
              day: 'MMM d',
              month: 'MMM yyyy'
            }
          }
        }
      }
    };
  }
}
