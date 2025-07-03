import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, of} from "rxjs";
import {Listing} from "../models/listing";
import {environment} from "../../environments/environment";
import {User} from "../models/user";
import {Sale} from "../models/sale";
import {Report} from "../models/report";
import {Bundle} from '../models/bundle';
import {Pagination} from '../models/pagination';

const endpoint = `${environment.backend.baseURL}/api/user`

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(`${endpoint}/all`);
  }

   get(): Observable<User> {
    return this.http.get<User>(`${endpoint}`);
  }

  getListings(limit: number, page: number): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${endpoint}/listings?limit=${limit}&page=${page}`);
  }

  searchListings(query: string, limit: number, page: number): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${endpoint}/listings?q=${query}&limit=${limit}&page=${page}`);
  }

  getListingsCount(query: string = ''): Observable<number> {
    return this.http.get<number>(`${endpoint}/listingscount?q=${query}`);
  }

  getSales(
    limit: number,
    page: number,
    query: string = '',
    dateFilter: string = 'all',
    sortBy: string = 'date_desc',
    minProducts: number = 0,
    missingCosts: boolean = false
  ): Observable<Pagination<Sale>> {
    let url = `${endpoint}/sales?limit=${limit}&page=${page}`;

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

  // Keep this method for backward compatibility
  searchSales(query: string, limit: number, page: number): Observable<Pagination<Sale>> {
    return this.getSales(limit, page, query);
  }

  getSalesWithMissingData(limit: number, page: number): Observable<Pagination<Sale>> {
    return this.http.get<Pagination<Sale>>(`${endpoint}/sales?missingData=true&limit=${limit}&page=${page}`);
  }

  getSalesCount(
    query: string = '',
    dateFilter: string = 'all',
    minProducts: number = 0,
    missingCosts: boolean = false
  ): Observable<number> {
    let url = `${endpoint}/salescount`;

    // Add query parameters
    const params = [];

    if (query && query.trim() !== '') {
      params.push(`q=${encodeURIComponent(query)}`);
    }

    if (dateFilter !== 'all') {
      params.push(`dateFilter=${dateFilter}`);
    }

    // Add minimum products filter if specified
    if (minProducts > 0) {
      params.push(`minProducts=${minProducts}`);
    }

    // Add missing costs filter if true
    if (missingCosts) {
      params.push(`missingCosts=true`);
    }

    // Add parameters to URL if any exist
    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get<number>(url);
  }

  getSalesWithMissingDataCount(): Observable<number> {
    return this.http.get<number>(`${endpoint}/salescount?missingData=true`);
  }

  getListingsWithMissingData(): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${endpoint}/listings?missingData=true`);
  }

  getReports(): Observable<Report[]> {
    return this.http.get<Report[]>(`${endpoint}/reports`);
  }

  getReportsByDate(year: number, month: number): Observable<Report[]> {
    return this.http.get<Report[]>(`${endpoint}/reports/${year}/${month}`);
  }

  getReportByDateAndType(year: number, month: number, type: string): Observable<Report> {
    return this.http.get<Report>(`${endpoint}/reports/${year}/${month}/${type}`);
  }

  getMetrics(timeframe: string, filterMissingCosts: boolean = true): Observable<{
    revenue: number;
    costs: number;
    profit: number;
    numberOfSales: number;
  }> {
    return this.http.get<{
      revenue: number;
      costs: number;
      profit: number;
      numberOfSales: number;
    }>(`${endpoint}/sales/metrics/${timeframe}${filterMissingCosts ? '?filterMissingCosts=true' : ''}`);
  }

  getGraphableMetrics(timeframe: string, filterMissingCosts: boolean = true): Observable<{
    labels: string[];
    series: { label: string; data: number[]; borderColor: string }[];
  }> {
    const params = new URLSearchParams();
    params.append('graphed', 'true');
    if (filterMissingCosts) {
      params.append('filterMissingCosts', 'true');
    }

    return this.http.get<{
      labels: string[];
      series: { label: string; data: number[]; borderColor: string }[];
    }>(`${endpoint}/sales/metrics/${timeframe}?${params.toString()}`);
  }

  create(id: string, email: string): Observable<any> {
    return this.http.post(endpoint, {id: id, email: email});
  }

  update(id: any, data: any): Observable<any> {
    return this.http.put(`${endpoint}/${id}`, data);
  }

  updateCurrency(currency: string, currencySymbol: string): Observable<any> {
    return this.http.put(`${endpoint}/currency`, { currency, currencySymbol });
  }

  updateExperimentalFeatures(experimentalFeatures: boolean): Observable<any> {
    return this.http.put(`${endpoint}/experimental-features`, { experimentalFeatures });
  }

  getActivePackage(id: any): Observable<Object> {
    return this.http.get(`${endpoint}/${id}/subscription`);
  }
}
