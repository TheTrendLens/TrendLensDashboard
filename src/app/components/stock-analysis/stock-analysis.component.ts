import { Component, OnInit } from '@angular/core';
import { DatePipe, NgIf, CurrencyPipe, NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { StockAnalysisService, StockAnalysisData, StockAnalysisFilter } from '../../services/stock-analysis.service';
import { Chart, registerables } from 'chart.js';
import { CurrencyService } from '../../services/currency.service';
import { ListingService } from '../../services/listing.service';
import { TourService } from '../../services/tour.service';

@Component({
  selector: 'app-stock-analysis',
  templateUrl: './stock-analysis.component.html',
  styleUrls: ['./stock-analysis.component.css'],
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    FormsModule,
    MatInputModule,
    DatePipe,
    CurrencyPipe
  ]
})
export class StockAnalysisComponent implements OnInit {
  // Data
  stockAnalysisData: StockAnalysisData | null = null;
  categories: string[] = [];
  brands: string[] = [];
  loading = false;
  error: string | null = null;

  // Make Math available in the template
  Math = Math;

  // Charts
  stockOverTimeChart: Chart | null = null;
  categoryChart: Chart | null = null;
  brandChart: Chart | null = null;
  ageOfStockChart: Chart | null = null;
  pricePointChart: Chart | null = null;

  // Filters
  startDate: Date = new Date();
  endDate: Date = new Date();
  selectedCategory: string = 'All';
  selectedBrand: string = 'All';
  selectedPriceRange: string = '';
  selectedStockLevel: string = '';
  selectedAgeOfStock: string = '';
  selectedSortBy: string = '';
  selectedSortDirection: 'asc' | 'desc' = 'desc';
  limit: number = 0;
  showAdvancedFilters: boolean = false;

  // Comparison
  showComparison: boolean = false;
  comparisonType: 'year' | 'month' | 'custom' = 'month';
  customPreviousStartDate: Date = new Date();
  customPreviousEndDate: Date = new Date();

  constructor(
    private stockAnalysisService: StockAnalysisService,
    private listingService: ListingService,
    private currencyService: CurrencyService,
    private tourService: TourService
  ) {
    Chart.register(...registerables);

    // Set default date range to last 30 days
    this.endDate = new Date();
    this.startDate = new Date();
    this.startDate.setDate(this.startDate.getDate() - 30);

    // Set custom previous dates to 30 days before the selected range
    this.customPreviousEndDate = new Date(this.startDate);
    this.customPreviousEndDate.setDate(this.customPreviousEndDate.getDate() - 1);
    this.customPreviousStartDate = new Date(this.customPreviousEndDate);
    this.customPreviousStartDate.setDate(this.customPreviousStartDate.getDate() - 30);
  }

  startTour() {
    // this.tourService.startTour('stock-analysis');
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadBrands();
    this.loadStockAnalysisData();
  }

  loadStockAnalysisData() {
    this.loading = true;
    this.error = null;

    const filter = this.buildStockAnalysisFilter();

    this.stockAnalysisService.getStockAnalysis(filter).subscribe({
      next: (data) => {
        this.stockAnalysisData = data;
        this.loading = false;

        // Initialize charts after data is loaded
        setTimeout(() => {
          this.initCharts();
        }, 0);
      },
      error: (error) => {
        this.error = 'Error loading stock analysis data: ' + error.message;
        this.loading = false;
      }
    });
  }

  buildStockAnalysisFilter(): StockAnalysisFilter {
    const filter: StockAnalysisFilter = {
      startDate: this.startDate,
      endDate: this.endDate
    };

    // Add optional filters if selected
    if (this.selectedCategory && this.selectedCategory !== 'All') {
      filter.category = this.selectedCategory;
    }

    if (this.selectedBrand && this.selectedBrand !== 'All') {
      filter.brand = this.selectedBrand;
    }

    if (this.selectedPriceRange) {
      filter.priceRange = this.selectedPriceRange;
    }

    if (this.selectedStockLevel) {
      filter.stockLevel = this.selectedStockLevel;
    }

    if (this.selectedAgeOfStock) {
      filter.ageOfStock = this.selectedAgeOfStock;
    }

    if (this.selectedSortBy) {
      filter.sortBy = this.selectedSortBy;
      filter.sortDirection = this.selectedSortDirection;
    }

    if (this.limit > 0) {
      filter.limit = this.limit;
    }

    return filter;
  }

  loadCategories() {
    this.listingService.getCategories().subscribe({
      next: (data) => {
        this.categories = ['All', ...data];
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadBrands() {
    this.listingService.getBrands().subscribe({
      next: (data) => {
        this.brands = ['All', ...data];
      },
      error: (error) => {
        console.error('Error loading brands:', error);
      }
    });
  }

  onCategoryChange() {
    this.loadStockAnalysisData();
  }

  onBrandChange() {
    this.loadStockAnalysisData();
  }

  onPriceRangeChange() {
    this.loadStockAnalysisData();
  }

  onStockLevelChange() {
    this.loadStockAnalysisData();
  }

  onAgeOfStockChange() {
    this.loadStockAnalysisData();
  }

  onSortChange() {
    this.loadStockAnalysisData();
  }

  toggleAdvancedFilters() {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  resetAdvancedFilters() {
    this.selectedPriceRange = '';
    this.selectedStockLevel = '';
    this.selectedAgeOfStock = '';
    this.selectedSortBy = '';
    this.selectedSortDirection = 'desc';
    this.limit = 0;

    // Reload data with reset filters
    this.loadStockAnalysisData();
  }

  applyDateFilter() {
    this.loadStockAnalysisData();
  }

  applyTimePreset(preset: string) {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    this.endDate = new Date(today);

    switch (preset) {
      case 'last7days':
        this.startDate = new Date(today);
        this.startDate.setDate(today.getDate() - 7);
        break;
      case 'last30days':
        this.startDate = new Date(today);
        this.startDate.setDate(today.getDate() - 30);
        break;
      case 'last90days':
        this.startDate = new Date(today);
        this.startDate.setDate(today.getDate() - 90);
        break;
      case 'thisMonth':
        this.startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'lastMonth':
        this.startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        this.endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisYear':
        this.startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case 'lastYear':
        this.startDate = new Date(today.getFullYear() - 1, 0, 1);
        this.endDate = new Date(today.getFullYear() - 1, 11, 31);
        break;
    }

    this.loadStockAnalysisData();
  }

  initCharts() {
    if (!this.stockAnalysisData) return;

    // Destroy existing charts to prevent duplicates
    if (this.stockOverTimeChart) this.stockOverTimeChart.destroy();
    if (this.categoryChart) this.categoryChart.destroy();
    if (this.brandChart) this.brandChart.destroy();
    if (this.ageOfStockChart) this.ageOfStockChart.destroy();
    if (this.pricePointChart) this.pricePointChart.destroy();

    // Initialize stock over time chart
    this.initStockOverTimeChart();

    // Initialize category chart
    this.initCategoryChart();

    // Initialize brand chart
    this.initBrandChart();

    // Initialize age of stock chart
    this.initAgeOfStockChart();

    // Initialize price point chart
    this.initPricePointChart();
  }

  initStockOverTimeChart() {
    if (!this.stockAnalysisData?.timeSeries || this.stockAnalysisData.timeSeries.length === 0) return;

    const ctx = document.getElementById('stockOverTimeChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = this.stockAnalysisData.timeSeries.map(item => item.date);
    const stockLevelData = this.stockAnalysisData.timeSeries.map(item => item.quantity);
    const stockCostData = this.stockAnalysisData.timeSeries.map(item => item.stockCost);

    this.stockOverTimeChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Stock Level',
            data: stockLevelData,
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            tension: 0.1,
            yAxisID: 'y',
            borderWidth: 3,
            fill: true
          },
          {
            label: 'Cost of Stock',
            data: stockCostData,
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            tension: 0.1,
            yAxisID: 'y1',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Stock Level'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Cost of Stock'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  }

  initCategoryChart() {
    if (!this.stockAnalysisData?.categories || this.stockAnalysisData.categories.length === 0) return;

    const ctx = document.getElementById('categoryChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = this.stockAnalysisData.categories.map(item => item.category);
    const countData = this.stockAnalysisData.categories.map(item => item.count);
    const valueData = this.stockAnalysisData.categories.map(item => item.value);

    this.categoryChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Listings Count',
            data: countData,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 1,
            yAxisID: 'y'
          },
          {
            label: 'Total Value',
            data: valueData,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Listings Count'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Total Value'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  }

  initBrandChart() {
    if (!this.stockAnalysisData?.brands || this.stockAnalysisData.brands.length === 0) return;

    const ctx = document.getElementById('brandChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Limit to top 10 brands by count
    const topBrands = [...this.stockAnalysisData.brands]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const labels = topBrands.map(item => item.brand);
    const countData = topBrands.map(item => item.count);
    const valueData = topBrands.map(item => item.value);

    this.brandChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Listings Count',
            data: countData,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1,
            yAxisID: 'y'
          },
          {
            label: 'Total Value',
            data: valueData,
            backgroundColor: 'rgba(255, 206, 86, 0.5)',
            borderColor: 'rgb(255, 206, 86)',
            borderWidth: 1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Listings Count'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Total Value'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  }

  initAgeOfStockChart() {
    if (!this.stockAnalysisData?.ageOfStock || this.stockAnalysisData.ageOfStock.length === 0) return;

    const ctx = document.getElementById('ageOfStockChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = this.stockAnalysisData.ageOfStock.map(item => item.range);
    const countData = this.stockAnalysisData.ageOfStock.map(item => item.count);
    const valueData = this.stockAnalysisData.ageOfStock.map(item => item.value);

    this.ageOfStockChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Listings Count',
            data: countData,
            backgroundColor: 'rgba(153, 102, 255, 0.5)',
            borderColor: 'rgb(153, 102, 255)',
            borderWidth: 1,
            yAxisID: 'y'
          },
          {
            label: 'Total Value',
            data: valueData,
            backgroundColor: 'rgba(255, 159, 64, 0.5)',
            borderColor: 'rgb(255, 159, 64)',
            borderWidth: 1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Listings Count'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Total Value'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  }

  initPricePointChart() {
    if (!this.stockAnalysisData?.pricePoints || this.stockAnalysisData.pricePoints.length === 0) return;

    const ctx = document.getElementById('pricePointChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = this.stockAnalysisData.pricePoints.map(item => item.range);
    const countData = this.stockAnalysisData.pricePoints.map(item => item.count);
    const valueData = this.stockAnalysisData.pricePoints.map(item => item.value);

    this.pricePointChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Listings Count',
            data: countData,
            backgroundColor: 'rgba(201, 203, 207, 0.5)',
            borderColor: 'rgb(201, 203, 207)',
            borderWidth: 1,
            yAxisID: 'y'
          },
          {
            label: 'Total Value',
            data: valueData,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Listings Count'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Total Value'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
  }

  getCurrencyCode(): string {
    const currencySymbol = this.currencyService.getCurrencySymbol();
    const currencyOption = this.currencyService.getCurrencyBySymbol(currencySymbol);

    return currencyOption?.code || 'GBP';
  }

  exportChartAsImage(chartId: string, fileName: string) {
    const canvas = document.getElementById(chartId) as HTMLCanvasElement;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = fileName + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  exportDataAsCSV(fileName: string) {
    if (!this.stockAnalysisData) return;

    let csvContent = 'data:text/csv;charset=utf-8,';

    // Add summary data
    csvContent += 'Summary\n';
    csvContent += `Total Listings,${this.stockAnalysisData.summary.totalListings}\n`;
    csvContent += `Total Items,${this.stockAnalysisData.summary.totalItems}\n`;
    csvContent += `Total Value,${this.stockAnalysisData.summary.totalValue}\n`;
    csvContent += `Average Listing Price,${this.stockAnalysisData.summary.averageListingPrice}\n`;
    csvContent += `Average Age of Stock,${this.stockAnalysisData.summary.averageAgeOfStock}\n\n`;

    // Add time series data
    if (this.stockAnalysisData.timeSeries && this.stockAnalysisData.timeSeries.length > 0) {
      csvContent += 'Time Series\n';
      csvContent += 'Date,Count,Value,Quantity\n';

      this.stockAnalysisData.timeSeries.forEach(item => {
        csvContent += `${item.date},${item.count},${item.value},${item.quantity}\n`;
      });

      csvContent += '\n';
    }

    // Add category data
    if (this.stockAnalysisData.categories && this.stockAnalysisData.categories.length > 0) {
      csvContent += 'Categories\n';
      csvContent += 'Category,Count,Value,Quantity,Average Price\n';

      this.stockAnalysisData.categories.forEach(item => {
        csvContent += `${item.category},${item.count},${item.value},${item.quantity},${item.averagePrice}\n`;
      });

      csvContent += '\n';
    }

    // Add brand data
    if (this.stockAnalysisData.brands && this.stockAnalysisData.brands.length > 0) {
      csvContent += 'Brands\n';
      csvContent += 'Brand,Count,Value,Quantity,Average Price\n';

      this.stockAnalysisData.brands.forEach(item => {
        csvContent += `${item.brand},${item.count},${item.value},${item.quantity},${item.averagePrice}\n`;
      });

      csvContent += '\n';
    }

    // Add age of stock data
    if (this.stockAnalysisData.ageOfStock && this.stockAnalysisData.ageOfStock.length > 0) {
      csvContent += 'Age of Stock\n';
      csvContent += 'Range,Count,Value,Quantity\n';

      this.stockAnalysisData.ageOfStock.forEach(item => {
        csvContent += `${item.range},${item.count},${item.value},${item.quantity}\n`;
      });

      csvContent += '\n';
    }

    // Add price point data
    if (this.stockAnalysisData.pricePoints && this.stockAnalysisData.pricePoints.length > 0) {
      csvContent += 'Price Points\n';
      csvContent += 'Range,Count,Value,Quantity\n';

      this.stockAnalysisData.pricePoints.forEach(item => {
        csvContent += `${item.range},${item.count},${item.value},${item.quantity}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', fileName + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
