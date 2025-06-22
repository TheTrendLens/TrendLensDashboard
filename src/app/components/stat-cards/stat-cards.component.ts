import {Component, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {take} from 'rxjs';
import { UserService } from '../../services/user.service';
import {NgClass, NgForOf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {BaseChartDirective} from 'ng2-charts';
import {Chart, ChartData, ChartDataset, ChartOptions, registerables, TooltipItem} from 'chart.js';
import TrendlineLinearPlugin from 'chartjs-plugin-trendline';

Chart.register(...registerables);
Chart.register(TrendlineLinearPlugin)

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
    { label: 'Last 30 Days', value: '30days' },
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
    this.userService.getMetrics(this.selectedTimeframe).pipe(take(1)).subscribe({
      next: (metrics) => {
        this.metrics = metrics;
      },
      error: (error) => {
        console.error(error);
      }
    });


    this.userService.getGraphableMetrics(this.selectedTimeframe).pipe(take(1)).subscribe({
      next: (metrics) => {
        this.chartData.labels = metrics.labels;
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

        this.barChartData.labels = metrics.labels;
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

}
