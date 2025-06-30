import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const endpoint = `${environment.backend.baseURL}/api/analytics`;

export interface AnalyticsSummary {
  totalSales: number;
  totalRevenue: number;
  totalFees: number;
  totalProfit: number;
  averageSalePrice: number;
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
}

export interface BrandData {
  brand: string;
  count: number;
  revenue: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  timeSeries: TimeSeriesData[];
  categories: CategoryData[];
  brands: BrandData[];
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(private http: HttpClient) { }

  /**
   * Get analytics data filtered by date range
   * @param startDate Start date for the analytics data
   * @param endDate End date for the analytics data
   */
  getAnalytics(startDate: Date, endDate: Date): Observable<AnalyticsData> {
    // Format dates as ISO strings (YYYY-MM-DD)
    const startDateStr = startDate.toUTCString();
    const endDateStr = endDate.toUTCString();

    return this.http.get<AnalyticsData>(`${endpoint}?startDate=${startDateStr}&endDate=${endDateStr}`);
  }
}
