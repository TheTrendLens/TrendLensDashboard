import { Component, OnInit } from '@angular/core';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { AnalyticsService, AnalyticsData } from '../../services/analytics.service';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
  imports: [NgForOf, FormsModule, MatInputModule, DatePipe, NgIf],
  standalone: true
})
export class AnalyticsComponent implements OnInit {
  // Date filters
  startDate: Date = new Date();
  endDate: Date = new Date();
  isLoading: boolean = false;
  analyticsData: AnalyticsData | null = null;

  // Charts
  salesChart: Chart | null = null;
  categoryChart: Chart | null = null;
  brandChart: Chart | null = null;

  constructor(private analyticsService: AnalyticsService) {
    // Set default date range to last 30 days
    this.startDate = new Date();
    this.startDate.setDate(this.startDate.getDate() - 30);
    this.endDate = new Date();
  }

  ngOnInit(): void {
    this.loadAnalyticsData();
  }

  loadAnalyticsData(): void {
    this.isLoading = true;

    this.analyticsService.getAnalytics(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.analyticsData = data;
        this.isLoading = false;

        // Initialize charts after data is loaded
        setTimeout(() => {
          this.initCharts();
        }, 100);
      },
      error: (error) => {
        console.error('Error loading analytics data:', error);
        this.isLoading = false;
      }
    });
  }

  applyDateFilter(): void {
    this.loadAnalyticsData();
  }

  initCharts(): void {
    if (!this.analyticsData) return;

    this.initSalesChart();
    this.initCategoryChart();
    this.initBrandChart();
  }

  initSalesChart(): void {
    if (!this.analyticsData) return;

    // Destroy existing chart if it exists
    if (this.salesChart) {
      this.salesChart.destroy();
    }

    const ctx = document.getElementById('salesChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = this.analyticsData.timeSeries.map(item => item.date);
    const revenueData = this.analyticsData.timeSeries.map(item => item.revenue);
    const profitData = this.analyticsData.timeSeries.map(item => item.profit);

    this.salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Revenue',
            data: revenueData,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1
          },
          {
            label: 'Profit',
            data: profitData,
            borderColor: 'rgb(153, 102, 255)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '£' + value;
              }
            }
          }
        }
      }
    });
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

    this.categoryChart = new Chart(ctx, {
      type: 'bar',
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
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
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
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true
      }
    });
  }

  formatCurrency(value: number): string {
    if (value === null || value === undefined) {
      return '£0.00';
    }

    return '£' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}
