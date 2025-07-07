import { Component, OnInit } from '@angular/core';
import {DatePipe, NgIf, CurrencyPipe, NgForOf, NgClass} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { AnalyticsService, AnalyticsData, ComparisonData, AnalyticsFilter } from '../../services/analytics.service';
import { BubbleDataPoint, Chart, ChartTypeRegistry, Point, registerables, TooltipItem} from 'chart.js';
import {CurrencyService} from '../../services/currency.service';
import {UserService} from '../../services/user.service';
import {ListingService} from '../../services/listing.service';
import { SalesOverTimeChartComponent } from './charts/sales-over-time-chart/sales-over-time-chart.component';
import { BrandChartComponent } from './charts/brand-chart/brand-chart.component';
import { CategoryChartComponent } from './charts/category-chart/category-chart.component';
import { TourService } from '../../services/tour.service';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css'],
  imports: [
    FormsModule,
    MatInputModule,
    DatePipe,
    NgIf,
    CurrencyPipe,
    NgForOf,
    NgClass,
    SalesOverTimeChartComponent,
    BrandChartComponent,
    CategoryChartComponent
  ],
  standalone: true
})
export class AnalyticsComponent implements OnInit {
  // Make Math available in the template
  Math = Math;

  // Date filters
  startDate: Date = new Date();
  endDate: Date = new Date();
  isLoading: boolean = false;
  analyticsData: AnalyticsData | null = null;
  selectedCategory: string = 'All';
  categories: string[] = [];
  isCategoryUpdating: boolean = false;

  // Advanced filtering properties
  selectedBrand: string = 'All';
  brands: string[] = [];
  isBrandUpdating: boolean = false;
  selectedPriceRange: string = '';
  priceRanges: string[] = ['0-10', '10-20', '20-50', '50-100', '100+'];
  selectedProfitMargin: string = '';
  profitMargins: string[] = ['0-10%', '10-20%', '20-30%', '30%+'];
  selectedSalesVelocity: string = '';
  salesVelocities: string[] = ['0-7 days', '7-14 days', '14-30 days', '30+ days'];
  sortOptions: {label: string, value: string}[] = [
    {label: 'Revenue (High to Low)', value: 'revenue:desc'},
    {label: 'Revenue (Low to High)', value: 'revenue:asc'},
    {label: 'Profit (High to Low)', value: 'profit:desc'},
    {label: 'Profit (Low to High)', value: 'profit:asc'},
    {label: 'Sales Count (High to Low)', value: 'count:desc'},
    {label: 'Sales Count (Low to High)', value: 'count:asc'}
  ];
  selectedSort: string = '';

  // Flag to show/hide advanced filters
  showAdvancedFilters: boolean = false;

  // Comparison properties
  enableComparison: boolean = false;
  comparisonData: ComparisonData | null = null;
  comparisonTypes = [
    {label: 'Same period last year', value: 'year'},
    {label: 'Previous month', value: 'month'},
    {label: 'Custom period', value: 'custom'}
  ];
  selectedComparisonType: 'year' | 'month' | 'custom' = 'year';
  customComparisonStartDate: Date = new Date();
  customComparisonEndDate: Date = new Date();
  showCustomDateRange: boolean = false;

  // Forecasting properties
  enableForecasting: boolean = false;
  forecastPeriod: number = 30; // Default forecast period in days
  forecastData: {revenue: {x: Date, y: number}[], profit: {x: Date, y: number}[]} | null = null;

  // Cache for expensive forecast calculations
  private monthlyForecastCache: {month: string, revenue: number, profit: number, trend: number}[] | null = null;

  // Time period presets
  timePresets = [
    {label: 'Last 7 Days', value: '7days'},
    {label: 'Last 30 Days', value: '30days'},
    {label: 'This Month', value: 'thisMonth'},
    {label: 'Last Month', value: 'lastMonth'},
    {label: 'Last Quarter', value: 'quarter'},
    {label: 'Year to Date', value: 'ytd'}
  ];
  selectedPreset: string = '';

  // Charts are now handled by individual components

  constructor(
    private analyticsService: AnalyticsService,
    private listingService: ListingService,
    private currencyService: CurrencyService,
    private tourService: TourService
  ) {
    // Set default date range to last 30 days
    this.startDate = new Date();
    this.startDate.setDate(this.startDate.getDate() - 120);
    this.endDate = new Date();
  }

  // Method to manually start the tour
  startTour(): void {
    this.tourService.startAnalyticsTour();
  }

  ngOnInit(): void {
    this.loadAnalyticsData();
    this.loadCategories();
    this.loadBrands();
  }

  loadAnalyticsData(): void {
    this.isLoading = true;

    if (this.enableComparison) {
      this.loadComparisonData();
    } else {
      // Create filter object with all selected filters
      const filter: AnalyticsFilter = this.buildAnalyticsFilter();

      this.analyticsService.getAnalytics(filter).subscribe({
        next: (data) => {
          this.analyticsData = data;
          this.comparisonData = null; // Clear any previous comparison data
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
  }

  /**
   * Build analytics filter object from component properties
   */
  buildAnalyticsFilter(): AnalyticsFilter {
    const filter: AnalyticsFilter = {
      startDate: this.startDate,
      endDate: this.endDate
    };

    // Add category filter if selected
    if (this.selectedCategory && this.selectedCategory !== 'All') {
      filter.category = this.selectedCategory;
    }

    // Add brand filter if selected
    if (this.selectedBrand && this.selectedBrand !== 'All') {
      filter.brand = this.selectedBrand;
    }

    // Add price range filter if selected
    if (this.selectedPriceRange) {
      filter.priceRange = this.selectedPriceRange;
    }

    // Add profit margin filter if selected
    if (this.selectedProfitMargin) {
      filter.profitMargin = this.selectedProfitMargin;
    }

    // Add sales velocity filter if selected
    if (this.selectedSalesVelocity) {
      filter.salesVelocity = this.selectedSalesVelocity;
    }

    // Add sort options if selected
    if (this.selectedSort) {
      const [sortBy, sortDirection] = this.selectedSort.split(':');
      filter.sortBy = sortBy;
      filter.sortDirection = sortDirection as 'asc' | 'desc';
    }

    return filter;
  }

  /**
   * Load comparison data for the selected period and comparison type
   */
  loadComparisonData(): void {
    // For custom comparison, ensure dates are valid
    if (this.selectedComparisonType === 'custom') {
      if (!this.customComparisonStartDate || !this.customComparisonEndDate) {
        alert('Please select both start and end dates for the comparison period.');
        this.isLoading = false;
        return;
      }

      if (this.customComparisonEndDate < this.customComparisonStartDate) {
        alert('Comparison end date must be after the start date.');
        this.isLoading = false;
        return;
      }
    }

    // Create filter object with all selected filters
    const filter = this.buildAnalyticsFilter();

    this.analyticsService.getAnalyticsComparison(
      filter,
      this.selectedComparisonType,
      this.customComparisonStartDate,
      this.customComparisonEndDate
    ).subscribe({
      next: (data) => {
        this.comparisonData = data;
        this.analyticsData = data.current; // Set current period data
        this.isLoading = false;

        // Initialize charts after data is loaded
        setTimeout(() => {
          this.initCharts();
        }, 100);
      },
      error: (error) => {
        console.error('Error loading comparison data:', error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Handle comparison type change
   */
  onComparisonTypeChange(): void {
    this.showCustomDateRange = this.selectedComparisonType === 'custom';

    if (this.enableComparison) {
      this.loadAnalyticsData();
    }
  }

  /**
   * Toggle comparison mode
   */
  toggleComparison(): void {
    this.enableComparison = !this.enableComparison;

    if (!this.enableComparison) {
      this.comparisonData = null;
    }

    this.loadAnalyticsData();
  }

  loadCategories(): void {
    this.isCategoryUpdating = true;

    this.listingService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.categories.unshift('All');
        this.isCategoryUpdating = false;
      },
      error: (error) => {
        console.error('Error loading categories data:', error);
        this.isCategoryUpdating = false;
      }
    });
  }

  loadBrands(): void {
    this.isBrandUpdating = true;

    this.listingService.getBrands().subscribe({
      next: (data) => {
        this.brands = data;
        this.brands.unshift('All');
        this.isBrandUpdating = false;
      },
      error: (error) => {
        console.error('Error loading brands data:', error);
        this.isBrandUpdating = false;

        // Fallback to some default brands if the API fails
        this.brands = ['All', 'Nike', 'Adidas', 'Puma', 'Reebok', 'Under Armour', 'New Balance', 'Other'];
      }
    });
  }

  onCategoryChange(): void {
    this.loadAnalyticsData();
  }

  onBrandChange(): void {
    this.loadAnalyticsData();
  }

  onPriceRangeChange(): void {
    this.loadAnalyticsData();
  }

  onProfitMarginChange(): void {
    this.loadAnalyticsData();
  }

  onSalesVelocityChange(): void {
    this.loadAnalyticsData();
  }

  onSortChange(): void {
    this.loadAnalyticsData();
  }

  /**
   * Toggle advanced filters visibility
   */
  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  /**
   * Reset all advanced filters to their default values
   */
  resetAdvancedFilters(): void {
    this.selectedBrand = 'All';
    this.selectedPriceRange = '';
    this.selectedProfitMargin = '';
    this.selectedSalesVelocity = '';
    this.selectedSort = '';

    this.loadAnalyticsData();
  }

  applyDateFilter(): void {
    this.selectedPreset = ''; // Clear any selected preset when manually applying date filter
    this.loadAnalyticsData();
  }

  applyTimePreset(preset: string): void {
    this.selectedPreset = preset;
    const today = new Date();

    switch (preset) {
      case '7days':
        this.endDate = new Date();
        this.startDate = new Date();
        this.startDate.setDate(this.startDate.getDate() - 7);
        break;

      case '30days':
        this.endDate = new Date();
        this.startDate = new Date();
        this.startDate.setDate(this.startDate.getDate() - 30);
        break;

      case 'thisMonth':
        this.endDate = new Date();
        this.startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;

      case 'lastMonth':
        this.endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        this.startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        break;

      case 'quarter':
        this.endDate = new Date();
        this.startDate = new Date();
        this.startDate.setDate(this.startDate.getDate() - 90);
        break;

      case 'ytd':
        this.endDate = new Date();
        this.startDate = new Date(today.getFullYear(), 0, 1);
        break;
    }

    this.loadAnalyticsData();
  }

  initCharts(): void {
    if (!this.analyticsData) return;

    // Generate forecast data if forecasting is enabled and data needs to be regenerated
    if (this.enableForecasting) {
      // Always regenerate forecast data when initCharts is called with forecasting enabled
      // This ensures the forecast data is updated when the forecast period changes
      this.generateForecastData();
    } else {
      this.forecastData = null;
      this.monthlyForecastCache = null;
    }
  }

  /**
   * Generate forecast data based on historical data
   * Uses simple linear regression to predict future values
   */
  generateForecastData(): void {
    if (!this.analyticsData || !this.analyticsData.timeSeries || this.analyticsData.timeSeries.length < 5) {
      // Need at least 5 data points for a meaningful forecast
      this.forecastData = null;
      this.monthlyForecastCache = null; // Reset cache when forecast data is cleared
      return;
    }

    // Reset the monthly forecast cache since we're generating new forecast data
    this.monthlyForecastCache = null;

    // Sort time series data by date
    const sortedTimeSeries = [...this.analyticsData.timeSeries].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Prepare data for linear regression
    const revenueData = sortedTimeSeries.map((item, index) => ({
      x: index, // Use index as x value for regression
      y: item.revenue,
      date: new Date(item.date)
    }));

    const profitData = sortedTimeSeries.map((item, index) => ({
      x: index,
      y: item.profit,
      date: new Date(item.date)
    }));

    // Calculate linear regression for revenue
    const revenueRegression = this.calculateLinearRegression(revenueData);

    // Calculate linear regression for profit
    const profitRegression = this.calculateLinearRegression(profitData);

    // Generate forecast data points
    const lastDataDate = new Date(sortedTimeSeries[sortedTimeSeries.length - 1].date);
    const today = new Date();
    const lastDate = lastDataDate > today ? lastDataDate : today;
    const forecastRevenue = [];
    const forecastProfit = [];

    for (let i = 1; i <= this.forecastPeriod; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i);

      // Predict revenue using the regression formula: y = mx + b
      const predictedRevenue = revenueRegression.slope * (revenueData.length + i - 1) + revenueRegression.intercept;

      // Predict profit using the regression formula: y = mx + b
      const predictedProfit = profitRegression.slope * (profitData.length + i - 1) + profitRegression.intercept;

      // Ensure predictions are not negative
      forecastRevenue.push({
        x: forecastDate,
        y: Math.max(0, predictedRevenue)
      });

      forecastProfit.push({
        x: forecastDate,
        y: Math.max(0, predictedProfit)
      });
    }

    this.forecastData = {
      revenue: forecastRevenue,
      profit: forecastProfit
    };
  }

  /**
   * Calculate linear regression coefficients (slope and intercept)
   * @param data Array of {x, y} points
   * @returns Object with slope and intercept
   */
  calculateLinearRegression(data: {x: number, y: number}[]): {slope: number, intercept: number} {
    const n = data.length;

    // Calculate means
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (const point of data) {
      sumX += point.x;
      sumY += point.y;
      sumXY += point.x * point.y;
      sumXX += point.x * point.x;
    }

    const meanX = sumX / n;
    const meanY = sumY / n;

    // Calculate slope and intercept
    const numerator = sumXY - n * meanX * meanY;
    const denominator = sumXX - n * meanX * meanX;

    // Avoid division by zero
    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = meanY - slope * meanX;

    return { slope, intercept };
  }

  /**
   * Toggle forecasting on/off
   */
  toggleForecasting(): void {
    this.enableForecasting = !this.enableForecasting;

    if (this.enableForecasting) {
      // Set loading state to prevent UI from freezing
      this.isLoading = true;

      // Use setTimeout to make the forecasting process asynchronous
      // This allows the UI to update and show the loading indicator
      setTimeout(() => {
        this.initCharts();
        this.isLoading = false;
      }, 50);
    } else {
      // If disabling forecasting, no heavy calculations needed
      this.initCharts();
    }
  }

  /**
   * Handle forecast period change event from the sales-over-time-chart component
   * @param period The new forecast period
   */
  onForecastPeriodChanged(period: number): void {
    this.forecastPeriod = period;
    this.initCharts();
  }

  /**
   * Handle brand selection from brand-chart component
   * @param brand The selected brand
   */
  onBrandSelected(brand: string): void {
    this.selectedBrand = brand;
    this.loadAnalyticsData();
  }

  /**
   * Handle category selection from category-chart component
   * @param category The selected category
   */
  onCategorySelected(category: string): void {
    this.selectedCategory = category;
    this.loadAnalyticsData();
  }

  // Chart initialization is now handled by individual chart components

  /**
   * Gets the current currency code from the CurrencyService
   * This is used by the CurrencyPipe in the template
   */
  getCurrencyCode(): string {
    const currencySymbol = this.currencyService.getCurrencySymbol();
    const currencyOption = this.currencyService.getCurrencyBySymbol(currencySymbol);

    return currencyOption?.code || 'GBP';
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
   * Group forecast data by month and calculate monthly totals and trends
   * @returns Array of monthly forecast data
   */
  getMonthlyForecast(): {month: string, revenue: number, profit: number, trend: number}[] {
    // Return cached result if available
    if (this.monthlyForecastCache !== null) {
      return this.monthlyForecastCache;
    }

    if (!this.forecastData) return [];

    const monthlyData: {[key: string]: {revenue: number, profit: number, days: number, month: string}} = {};

    // Group data by month
    for (let i = 0; i < this.forecastData.revenue.length; i++) {
      const date: Date = this.forecastData.revenue[i].x;
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          revenue: 0,
          profit: 0,
          days: 0,
          month: monthName
        };
      }

      monthlyData[monthKey].revenue += this.forecastData.revenue[i].y;
      monthlyData[monthKey].profit += this.forecastData.profit[i].y;
      monthlyData[monthKey].days += 1;
    }

    // Convert to array and calculate trends
    const result = Object.keys(monthlyData).map(key => {
      const data = monthlyData[key];

      // Calculate trend based on daily average change within the month
      let trend = 0;
      if (data.days > 1) {
        const monthRevenue = this.forecastData?.revenue.filter(item => {
          const date = item.x;
          const itemMonthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
          return itemMonthKey === key;
        });

        if (monthRevenue?.length! > 1) {
          const firstDayRevenue = monthRevenue![0].y;
          const lastDayRevenue = monthRevenue![monthRevenue?.length! - 1].y;

          if (firstDayRevenue > 0) {
            trend = ((lastDayRevenue - firstDayRevenue) / firstDayRevenue) * 100;
          }
        }
      }

      return {
        month: data.month,
        revenue: data.revenue,
        profit: data.profit,
        trend: trend
      };
    });

    // Sort by month
    const sortedResult = result.sort((a, b) => {
      const monthA = new Date(a.month).getTime();
      const monthB = new Date(b.month).getTime();
      return monthA - monthB;
    });

    // Cache the result to avoid redundant calculations
    this.monthlyForecastCache = sortedResult;

    return sortedResult;
  }

  /**
   * Generate inventory planning recommendation based on forecast data
   * @returns Recommendation text
   */
  getInventoryRecommendation(): string {
    if (!this.forecastData || !this.analyticsData) return 'Insufficient data for inventory recommendations.';

    const trend = this.getForecastTrend(this.forecastData.revenue);
    const totalForecastSales = this.getTotalForecastValue(this.forecastData.revenue) / this.forecastPeriod * 30; // Monthly forecast

    // Get top categories
    const topCategories = this.analyticsData.categories
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(c => c.category);

    if (trend > 10) {
      return `Based on the strong upward trend (${trend.toFixed(1)}%), consider increasing inventory levels by 15-20% for the next month, especially for top categories like ${topCategories.join(', ')}.`;
    } else if (trend > 0) {
      return `With a modest growth trend (${trend.toFixed(1)}%), maintain current inventory levels with a slight increase (5-10%) for top-selling categories like ${topCategories.join(', ')}.`;
    } else if (trend > -10) {
      return `Sales are relatively stable with a slight downward trend (${Math.abs(trend).toFixed(1)}%). Consider maintaining current inventory levels but focus on your best-performing categories: ${topCategories.join(', ')}.`;
    } else {
      return `With a significant downward trend (${Math.abs(trend).toFixed(1)}%), consider reducing inventory by 10-15% to avoid excess stock. Focus on your most reliable categories: ${topCategories.join(', ')}.`;
    }
  }

  /**
   * Generate pricing strategy recommendation based on forecast data
   * @returns Recommendation text
   */
  getPricingRecommendation(): string {
    if (!this.forecastData || !this.analyticsData) return 'Insufficient data for pricing recommendations.';

    const trend = this.getForecastTrend(this.forecastData.revenue);
    const profitTrend = this.getForecastTrend(this.forecastData.profit);

    // Check if profit margin is decreasing
    const isProfitMarginDecreasing = profitTrend < trend;

    // Get price point data if available
    const optimalPriceRange = this.analyticsData.pricePoints?.sort((a, b) => {
      // Sort by profit per item (profit / count)
      const profitPerItemA = a.profit ? a.profit / a.count : 0;
      const profitPerItemB = b.profit ? b.profit / b.count : 0;
      return profitPerItemB - profitPerItemA;
    })[0]?.priceRange;

    if (trend > 10) {
      if (isProfitMarginDecreasing) {
        return `With strong demand growth (${trend.toFixed(1)}%) but decreasing profit margins, consider selective price increases of 5-7% on your most popular items to improve profitability.`;
      } else {
        return `Strong demand growth (${trend.toFixed(1)}%) with healthy profit margins suggests your pricing is effective. Consider testing slightly higher prices (3-5%) on new inventory to maximize revenue.`;
      }
    } else if (trend > 0) {
      if (optimalPriceRange) {
        return `With moderate growth (${trend.toFixed(1)}%), focus on optimizing your pricing within the ${optimalPriceRange} range, which shows the best profit per item based on your historical data.`;
      } else {
        return `Maintain current pricing strategy with the moderate growth trend (${trend.toFixed(1)}%). Consider bundle offers to increase average order value.`;
      }
    } else {
      if (isProfitMarginDecreasing) {
        return `With a declining sales trend (${Math.abs(trend).toFixed(1)}%) and decreasing profit margins, avoid broad discounting. Instead, offer targeted promotions on slow-moving inventory while maintaining prices on best sellers.`;
      } else {
        return `To address the declining sales trend (${Math.abs(trend).toFixed(1)}%), consider limited-time promotions or bundle discounts rather than permanent price reductions to stimulate demand without sacrificing perceived value.`;
      }
    }
  }

  /**
   * Generate growth opportunity recommendation based on forecast data
   * @returns Recommendation text
   */
  getGrowthRecommendation(): string {
    if (!this.forecastData || !this.analyticsData) return 'Insufficient data for growth recommendations.';

    // Get top performing categories and brands
    const topCategory = this.analyticsData.categories
      .sort((a, b) => (b.profitMargin || 0) - (a.profitMargin || 0))
      .slice(0, 1)[0]?.category;

    const topBrand = this.analyticsData.brands
      .sort((a, b) => (b.profitMargin || 0) - (a.profitMargin || 0))
      .slice(0, 1)[0]?.brand;

    // Get fastest selling items
    const fastestSellingCategory = this.analyticsData.categories
      .sort((a, b) => (a.averageTurnover || 999) - (b.averageTurnover || 999))
      .slice(0, 1)[0];

    const trend = this.getForecastTrend(this.forecastData.revenue);

    let recommendation = '';

    if (trend > 5) {
      recommendation = `With positive growth trends (${trend.toFixed(1)}%), focus on scaling your most profitable segments. `;
    } else if (trend < -5) {
      recommendation = `To counter the current downward trend (${Math.abs(trend).toFixed(1)}%), diversify your inventory and explore new product categories. `;
    } else {
      recommendation = `With stable sales projections, focus on optimizing your current inventory mix and improving margins. `;
    }

    if (topCategory && topBrand) {
      recommendation += `Your highest profit margins are in the ${topCategory} category and ${topBrand} brand - consider expanding these offerings. `;
    }

    if (fastestSellingCategory) {
      recommendation += `Items in the ${fastestSellingCategory.category} category sell fastest (avg. ${fastestSellingCategory.averageTurnover?.toFixed(1)} days), indicating strong demand you could capitalize on.`;
    }

    return recommendation;
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
   * @param data The data to export
   * @param fileName The name of the file to download
   */
  exportDataAsCSV(fileName: string): void {
    if (!this.analyticsData) return;

    let csvContent = 'data:text/csv;charset=utf-8,';

    // For time series data
    if (fileName === 'sales-over-time') {
      // Add header row
      csvContent += 'Date,Sales Count,Revenue,Profit\n';

      // Add data rows
      this.analyticsData.timeSeries.forEach(item => {
        csvContent += `${item.date},${item.count},${item.revenue},${item.profit}\n`;
      });
    }
    // For category data
    else if (fileName === 'categories') {
      // Add header row
      csvContent += 'Category,Sales Count,Revenue,Profit,Profit Margin (%),Avg Days to Sell\n';

      // Add data rows
      this.analyticsData.categories.forEach(item => {
        const profitMargin = item.profitMargin !== undefined ? item.profitMargin.toFixed(1) : 'N/A';
        const avgTurnover = item.averageTurnover !== undefined ? item.averageTurnover.toFixed(1) : 'N/A';
        csvContent += `${item.category},${item.count},${item.revenue},${item.profit || 0},${profitMargin},${avgTurnover}\n`;
      });
    }
    // For brand data
    else if (fileName === 'brands') {
      // Add header row
      csvContent += 'Brand,Sales Count,Revenue,Profit,Profit Margin (%),Avg Days to Sell\n';

      // Add data rows
      this.analyticsData.brands.forEach(item => {
        const profitMargin = item.profitMargin !== undefined ? item.profitMargin.toFixed(1) : 'N/A';
        const avgTurnover = item.averageTurnover !== undefined ? item.averageTurnover.toFixed(1) : 'N/A';
        csvContent += `${item.brand},${item.count},${item.revenue},${item.profit || 0},${profitMargin},${avgTurnover}\n`;
      });
    }
    // For sales velocity data
    else if (fileName === 'sales-velocity' && this.analyticsData.salesVelocity) {
      // Add header row
      csvContent += 'Time to Sell,Sales Count,Revenue,Profit\n';

      // Add data rows
      this.analyticsData.salesVelocity.forEach(item => {
        csvContent += `${item.range},${item.count},${item.revenue},${item.profit || 0}\n`;
      });
    }
    // For price point analysis data
    else if (fileName === 'price-points' && this.analyticsData.pricePoints) {
      // Add header row
      csvContent += 'Price Range,Sales Count,Revenue,Profit,Avg Days to Sell\n';

      // Add data rows
      this.analyticsData.pricePoints.forEach(item => {
        const avgTurnover = item.averageTurnover !== undefined ? item.averageTurnover.toFixed(1) : 'N/A';
        csvContent += `${item.priceRange},${item.count},${item.revenue},${item.profit || 0},${avgTurnover}\n`;
      });
    }

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
