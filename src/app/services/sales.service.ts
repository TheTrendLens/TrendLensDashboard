import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Sale } from '../models/sale';
import {Pagination} from '../models/pagination';

const endpoint = `${environment.backend.baseURL}/api/sales`;

@Injectable({
  providedIn: 'root'
})
export class SalesService {

  constructor(private http: HttpClient) { }

  getSales(
    limit: number,
    page: number,
    query: string = '',
    dateFilter: string = 'all',
    sortBy: string = 'date_desc',
    minProducts: number = 0,
    missingCosts: boolean = false
  ): Observable<Pagination<Sale>> {
    let url = `${endpoint}?limit=${limit}&page=${page}`;

    // Add search query if provided
    if (query && query.trim() !== '') {
      url += `&q=${encodeURIComponent(query)}`;
    }

    // Add date filter if not 'all'
    if (dateFilter !== 'all') {
      url += `&dateFilter=${dateFilter}`;
    }

    // Add sort parameter
    if (sortBy) {
      url += `&sort=${sortBy}`;
    }

    // Add minimum products filter if specified
    if (minProducts > 0) {
      url += `&minProducts=${minProducts}`;
    }

    // Add missing costs filter if true
    if (missingCosts) {
      url += `&missingCosts=true`;
    }

    return this.http.get<Pagination<Sale>>(url);
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

  // Keep this method for backward compatibility
  searchSales(query: string, limit: number, page: number): Observable<Pagination<Sale>> {
    return this.getSales(limit, page, query);
  }

  uploadCSVSales(file: File, user: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user);
    return this.http.post(`${environment.backend.baseURL}/api/csv-import/sales`, formData);
  }

  getSalesMetrics(timeframe?: string, graphed?: boolean, filterMissingCosts?: boolean): Observable<any> {
    let url = `${endpoint}/metrics`;
    if (timeframe) {
      url += `/${timeframe}`;
    }

    let params = {};
    if (graphed !== undefined) {
      // @ts-ignore
      params['graphed'] = graphed;
    }
    if (filterMissingCosts !== undefined) {
      // @ts-ignore
      params['filterMissingCosts'] = filterMissingCosts;
    }

    return this.http.get<any>(url, { params });
  }
}
