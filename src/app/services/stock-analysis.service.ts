import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const endpoint = `${environment.backend.baseURL}/api/stock-analysis`;

export interface StockAnalysisSummary {
  totalListings: number;
  totalItems: number;
  totalValue: number;
  averageListingPrice: number;
  averageAgeOfStock: number;
}

export interface TimeSeriesData {
  date: string;
  count: number;
  value: number;
  quantity: number;
  stockCost: number;
}

export interface CategoryData {
  category: string;
  count: number;
  value: number;
  quantity: number;
  averagePrice: number;
}

export interface BrandData {
  brand: string;
  count: number;
  value: number;
  quantity: number;
  averagePrice: number;
}

export interface AgeOfStockData {
  range: string; // e.g., "0-7 days", "8-14 days", etc.
  count: number;
  value: number;
  quantity: number;
}

export interface PricePointData {
  range: string; // e.g., "0-10", "11-20", etc.
  count: number;
  value: number;
  quantity: number;
}

export interface StockAnalysisFilter {
  startDate: Date;
  endDate: Date;
  category?: string;
  brand?: string;
  priceRange?: string;
  stockLevel?: string; // e.g., "0-10", "10-20", etc.
  ageOfStock?: string; // e.g., "0-7", "7-14", etc.
  sortBy?: string; // e.g., "price", "age", "quantity"
  sortDirection?: 'asc' | 'desc';
  limit?: number;
}

export interface StockAnalysisData {
  summary: StockAnalysisSummary;
  timeSeries: TimeSeriesData[];
  categories: CategoryData[];
  brands: BrandData[];
  ageOfStock?: AgeOfStockData[];
  pricePoints?: PricePointData[];
}

export interface ComparisonData {
  current: StockAnalysisData;
  previous: StockAnalysisData;
  changes: {
    listingsChange: number;
    itemsChange: number;
    valueChange: number;
    averagePriceChange: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StockAnalysisService {
  constructor(private http: HttpClient) { }

  /**
   * Get stock analysis data filtered by various parameters
   * @param filter Object containing all filter parameters
   */
  getStockAnalysis(filter: StockAnalysisFilter): Observable<StockAnalysisData> {
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

    if (filter.stockLevel) {
      params = params.set('stockLevel', filter.stockLevel);
    }

    if (filter.ageOfStock) {
      params = params.set('ageOfStock', filter.ageOfStock);
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

    return this.http.get<StockAnalysisData>(endpoint, { params });
  }

  /**
   * Get stock analysis data with comparison to previous period
   * @param filter Object containing all filter parameters for the current period
   * @param comparisonType Type of comparison ('year', 'month', 'custom')
   * @param customPreviousStartDate Custom start date for previous period (only used if comparisonType is 'custom')
   * @param customPreviousEndDate Custom end date for previous period (only used if comparisonType is 'custom')
   */
  getStockAnalysisComparison(
    filter: StockAnalysisFilter,
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
      const previousFilter: StockAnalysisFilter = {
        ...filter,
        startDate: previousStartDate,
        endDate: previousEndDate
      };

      // Get current period data
      this.getStockAnalysis(filter).subscribe({
        next: (currentData) => {
          // Get previous period data
          this.getStockAnalysis(previousFilter).subscribe({
            next: (previousData) => {
              // Calculate percentage changes
              const listingsChange = previousData.summary.totalListings === 0 ?
                100 : // If previous was 0, treat as 100% increase
                ((currentData.summary.totalListings - previousData.summary.totalListings) / previousData.summary.totalListings) * 100;

              const itemsChange = previousData.summary.totalItems === 0 ?
                100 :
                ((currentData.summary.totalItems - previousData.summary.totalItems) / previousData.summary.totalItems) * 100;

              const valueChange = previousData.summary.totalValue === 0 ?
                100 :
                ((currentData.summary.totalValue - previousData.summary.totalValue) / previousData.summary.totalValue) * 100;

              const averagePriceChange = previousData.summary.averageListingPrice === 0 ?
                100 :
                ((currentData.summary.averageListingPrice - previousData.summary.averageListingPrice) / previousData.summary.averageListingPrice) * 100;

              // Create comparison data object
              const comparisonData: ComparisonData = {
                current: currentData,
                previous: previousData,
                changes: {
                  listingsChange,
                  itemsChange,
                  valueChange,
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
