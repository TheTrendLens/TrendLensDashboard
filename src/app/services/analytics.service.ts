import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const endpoint = `${environment.backend.baseURL}/api/analytics`;

export interface AnalyticsSummary {
  totalSales: number;
  totalRevenue: number;
  totalFees: number;
  totalShipping: number;
  totalCOGS: number;
  totalCosts: number;
  totalProfit: number;
  roi: number;
  averageProfit: number;
  averageSalePrice: number;
  averageInventoryTurnover?: number; // Average days from listing to sale
}

export interface TimeSeriesData {
  date: string;
  count: number;
  revenue: number;
  profit: number;
}

export interface CategoryData {
  category: string;
  count: number;
  revenue: number;
  profit?: number;
  profitMargin?: number; // Profit as percentage of revenue
  averageTurnover?: number; // Average days from listing to sale
}

export interface BrandData {
  brand: string;
  count: number;
  revenue: number;
  profit?: number;
  profitMargin?: number; // Profit as percentage of revenue
  averageTurnover?: number; // Average days from listing to sale
}

export interface SalesVelocityData {
  range: string; // e.g., "0-7 days", "8-14 days", etc.
  count: number;
  revenue: number;
  profit?: number;
}

export interface PricePointData {
  priceRange: string; // e.g., "0-10", "11-20", etc.
  count: number;
  revenue: number;
  profit?: number;
  averageTurnover?: number;
}

export interface AnalyticsFilter {
  startDate: Date;
  endDate: Date;
  category?: string;
  brand?: string;
  priceRange?: string;
  profitMargin?: string; // e.g., "0-10", "10-20", etc.
  salesVelocity?: string; // e.g., "0-7", "7-14", etc.
  sortBy?: string; // e.g., "revenue", "profit", "count"
  sortDirection?: 'asc' | 'desc';
  limit?: number;
}

export interface TopProductData {
  id: string;
  description: string;
  brand: string;
  category: string;
  revenue: number;
  profit: number;
  item_cost: number;
  date_sold: string;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  timeSeries: TimeSeriesData[];
  categories: CategoryData[];
  brands: BrandData[];
  salesVelocity?: SalesVelocityData[];
  pricePoints?: PricePointData[];
  topProducts?: TopProductData[];
}

export interface ComparisonData {
  current: AnalyticsData;
  previous: AnalyticsData;
  changes: {
    salesChange: number;
    revenueChange: number;
    profitChange: number;
    averagePriceChange: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);

  /**
   * Get analytics data filtered by various parameters
   * @param filter Object containing all filter parameters
   */
  getAnalytics(filter: AnalyticsFilter): Observable<AnalyticsData> {
    // Format dates as ISO strings (YYYY-MM-DD)
    const startDateStr = new Date(filter.startDate).toISOString().split('T')[0];
    const endDateStr = new Date(filter.endDate).toISOString().split('T')[0];

    // Build query parameters
    let params = new HttpParams()
      .set('startDate', startDateStr)
      .set('endDate', endDateStr);

    // Add optional filters if they exist
    if (filter.category && filter.category !== 'All') {
      params = params.set('category', filter.category);
    }

    if (filter.brand && filter.brand !== 'All') {
      params = params.set('brand', filter.brand);
    }

    if (filter.priceRange) {
      params = params.set('priceRange', filter.priceRange);
    }

    if (filter.profitMargin) {
      params = params.set('profitMargin', filter.profitMargin);
    }

    if (filter.salesVelocity) {
      params = params.set('salesVelocity', filter.salesVelocity);
    }

    if (filter.sortBy) {
      params = params.set('sortBy', filter.sortBy);

      if (filter.sortDirection) {
        params = params.set('sortDirection', filter.sortDirection);
      }
    }

    if (filter.limit) {
      params = params.set('limit', filter.limit.toString());
    }

    return this.http.get<AnalyticsData>(endpoint, { params });
  }

  /**
   * Legacy method for backward compatibility
   * @deprecated Use getAnalytics with AnalyticsFilter instead
   */
  getAnalyticsLegacy(startDate: Date, endDate: Date, category: string): Observable<AnalyticsData> {
    return this.getAnalytics({
      startDate,
      endDate,
      category: category !== 'All' ? category : undefined
    });
  }

  /**
   * Get analytics data with comparison to previous period
   * @param filter Object containing all filter parameters for the current period
   * @param comparisonType Type of comparison ('year', 'month', 'custom')
   * @param customPreviousStartDate Custom start date for previous period (only used if comparisonType is 'custom')
   * @param customPreviousEndDate Custom end date for previous period (only used if comparisonType is 'custom')
   */
  getAnalyticsComparison(
    filter: AnalyticsFilter,
    comparisonType: 'year' | 'month' | 'custom',
    customPreviousStartDate?: Date,
    customPreviousEndDate?: Date
  ): Observable<ComparisonData> {
    // Calculate previous period dates based on comparison type
    let previousStartDate: Date;
    let previousEndDate: Date;

    if (comparisonType === 'custom' && customPreviousStartDate && customPreviousEndDate) {
      // Use custom dates if provided
      previousStartDate = new Date(customPreviousStartDate);
      previousEndDate = new Date(customPreviousEndDate);
    } else {
      // Calculate previous period based on current period
      const currentPeriodDays = Math.round((filter.endDate.getTime() - filter.startDate.getTime()) / (1000 * 60 * 60 * 24));

      previousEndDate = new Date(filter.startDate);
      previousEndDate.setDate(previousEndDate.getDate() - 1);

      previousStartDate = new Date(previousEndDate);
      previousStartDate.setDate(previousStartDate.getDate() - currentPeriodDays);

      if (comparisonType === 'year') {
        // Compare with same period last year
        previousStartDate = new Date(filter.startDate);
        previousEndDate = new Date(filter.endDate);
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
        previousEndDate.setFullYear(previousEndDate.getFullYear() - 1);
      } else if (comparisonType === 'month') {
        // Compare with previous month (adjusted for different month lengths)
        previousEndDate = new Date(filter.startDate);
        previousEndDate.setDate(previousEndDate.getDate() - 1);

        previousStartDate = new Date(previousEndDate);
        previousStartDate.setDate(1);
      }
    }

    // Get data for both periods
    return new Observable<ComparisonData>(observer => {
      // Create filter for previous period by copying current filter and updating dates
      const previousFilter: AnalyticsFilter = {
        ...filter,
        startDate: previousStartDate,
        endDate: previousEndDate
      };

      // Get current period data
      this.getAnalytics(filter).subscribe({
        next: (currentData) => {
          // Get previous period data
          this.getAnalytics(previousFilter).subscribe({
            next: (previousData) => {
              // Calculate percentage changes
              const salesChange = previousData.summary.totalSales === 0 ?
                100 : // If previous was 0, treat as 100% increase
                ((currentData.summary.totalSales - previousData.summary.totalSales) / previousData.summary.totalSales) * 100;

              const revenueChange = previousData.summary.totalRevenue === 0 ?
                100 :
                ((currentData.summary.totalRevenue - previousData.summary.totalRevenue) / previousData.summary.totalRevenue) * 100;

              const profitChange = previousData.summary.totalProfit === 0 ?
                100 :
                ((currentData.summary.totalProfit - previousData.summary.totalProfit) / previousData.summary.totalProfit) * 100;

              const averagePriceChange = previousData.summary.averageSalePrice === 0 ?
                100 :
                ((currentData.summary.averageSalePrice - previousData.summary.averageSalePrice) / previousData.summary.averageSalePrice) * 100;

              // Create comparison data object
              const comparisonData: ComparisonData = {
                current: currentData,
                previous: previousData,
                changes: {
                  salesChange,
                  revenueChange,
                  profitChange,
                  averagePriceChange
                }
              };

              observer.next(comparisonData);
              observer.complete();
            },
            error: (error) => {
              observer.error(error);
            }
          });
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }
}
