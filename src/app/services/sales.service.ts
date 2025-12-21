import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Sale } from '../models/sale';
import { Pagination } from '../models/pagination';
import { SaleSearch, SortField, SortDirection, DateFilterOption } from '../models/sale-search';

const endpoint = `${environment.backend.baseURL}/api/sales`;

@Injectable({
  providedIn: 'root'
})
export class SalesService {

  constructor(private http: HttpClient) { }

  /**
   * Get sales with various filter options
   * This method now uses the enhanced search endpoint
   */
  getSales(
    limit: number,
    page: number,
    query: string = '',
    dateFilter: string = 'all',
    sortBy: string = 'date_desc',
    minProducts: number = 0,
    missingCosts: boolean = false,
    startDateString?: string,
    endDateString?: string
  ): Observable<Pagination<Sale>> {
    // Parse the sort parameter
    const [sortField, sortDirection] = sortBy.split('_');

    // Create a search params object
    const searchParams: SaleSearch = {
      limit,
      page,
      q: query,
      dateFilter: dateFilter as DateFilterOption,
      startDate: startDateString ? startDateString : undefined,
      endDate: endDateString ? endDateString : undefined,
      sortField: sortField as SortField,
      sortDirection: sortDirection as SortDirection,
      minProducts: minProducts > 0 ? minProducts : undefined,
      missingCosts: missingCosts || undefined
    };

    // Use the enhanced search method
    return this.searchSalesEnhanced(searchParams);
  }

  findOne(id: string): Observable<Sale> {
    return this.http.get<Sale>(`${endpoint}/${id}`);
  }

  update(data: Sale): Observable<Sale> {
    return this.http.put<Sale>(`${endpoint}`, data);
  }

  create(data: Partial<Sale>): Observable<Sale> {
    return this.http.post<Sale>(`${endpoint}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${endpoint}/${id}`);
  }

  /**
   * Enhanced search method that uses the new /api/sales/search endpoint
   * @param searchParams The search parameters
   */
  searchSalesEnhanced(searchParams: SaleSearch): Observable<Pagination<Sale>> {
    const url = `${endpoint}/search`;

    // Convert the search params object to HttpParams
    let params = new HttpParams();

    // Add all non-undefined parameters
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined) {
        // Handle arrays (brands, categories, paymentTypes)
        if (Array.isArray(value)) {
          value.forEach(item => {
            params = params.append(key, item);
          });
        } else {
          params = params.append(key, value.toString());
        }
      }
    });

    return this.http.get<Pagination<Sale>>(url, { params });
  }

  // Updated to use the enhanced search
  searchSales(query: string, limit: number, page: number): Observable<Pagination<Sale>> {
    const searchParams: SaleSearch = {
      q: query,
      limit: limit,
      page: page
    };
    return this.searchSalesEnhanced(searchParams);
  }

  uploadSales(sales: Sale[]): Observable<Sale[]> {
    return this.http.post<Sale[]>(`${environment.backend.baseURL}/api/csv-import/sales`, sales);
  }

  getSalesMetrics(
    timeframe?: string,
    graphed?: boolean,
    filterMissingCosts?: boolean,
    includeSalesTax?: boolean,
  ): Observable<any> {
    let url = `${endpoint}/metrics`;
    if (timeframe) {
      url += `/${timeframe}`;
    }

    let params: { [key: string]: string | boolean } = {};
    if (graphed !== undefined) {
      // @ts-ignore
      params['graphed'] = graphed;
    }
    if (filterMissingCosts !== undefined) {
      // @ts-ignore
      params['filterMissingCosts'] = filterMissingCosts;
    }

    if (includeSalesTax !== undefined) {
      // expose tax series/field when requested
      params['includeSalesTax'] = includeSalesTax;
    }

    return this.http.get<any>(url, { params });
  }
}
