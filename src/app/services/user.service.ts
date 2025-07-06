import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {BehaviorSubject, Observable, tap} from "rxjs";
import {Listing} from "../models/listing";
import {environment} from "../../environments/environment";
import {User} from "../models/user";
import {Sale} from "../models/sale";
import {Report} from "../models/report";
import {Pagination} from '../models/pagination';

const endpoint = `${environment.backend.baseURL}/api/user`
const USER_STORAGE_KEY = 'dbUser';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Initialize from localStorage if available
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    }
  }

  /**
   * Clear the current user data
   */
  clearUserData(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(`${endpoint}/all`);
  }

   get(): Observable<User> {
    return this.http.get<User>(`${endpoint}`).pipe(
      tap(user => {
        // Update the BehaviorSubject with the new user data
        this.currentUserSubject.next(user);
        // Also update localStorage for backward compatibility
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      })
    );
  }

  /**
   * Get the current user value without making an HTTP request
   * @returns The current user or null if not available
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.getValue();
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
    }>(`${environment.backend.baseURL}/api/sales/metrics/${timeframe}${filterMissingCosts ? '?filterMissingCosts=true' : ''}`);
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
    }>(`${environment.backend.baseURL}/api/sales/metrics/${timeframe}?${params.toString()}`);
  }

  create(id: string, email: string): Observable<any> {
    return this.http.post(endpoint, {id: id, email: email}).pipe(
      tap(userData => {
        // @ts-ignore
        this.currentUserSubject.next(userData);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      })
    );
  }

  update(id: any, data: any): Observable<any> {
    return this.http.put(`${endpoint}/${id}`, data).pipe(
      tap(updatedUser => {
        // Update the current user with the new data
        const currentUser = this.currentUserSubject.getValue();
        const newUserData = { ...currentUser, ...updatedUser };
        // @ts-ignore
        this.currentUserSubject.next(newUserData);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUserData));
      })
    );
  }

  updateCurrency(currency: string, currencySymbol: string): Observable<any> {
    return this.http.put(`${endpoint}/currency`, { currency, currencySymbol }).pipe(
      tap(response => {
        // Update the current user with the new currency settings
        const currentUser = this.currentUserSubject.getValue();
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            currency,
            currencySymbol
          };
          this.currentUserSubject.next(updatedUser);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        }
      })
    );
  }

  updateExperimentalFeatures(experimentalFeatures: boolean): Observable<any> {
    return this.http.put(`${endpoint}/experimental-features`, { experimentalFeatures }).pipe(
      tap(response => {
        // Update the current user with the new experimental features setting
        const currentUser = this.currentUserSubject.getValue();
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            experimental_features: experimentalFeatures
          };
          this.currentUserSubject.next(updatedUser);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        }
      })
    );
  }

  getActivePackage(id: any): Observable<Object> {
    return this.http.get(`${endpoint}/${id}/subscription`);
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${endpoint}/categories`);
  }
}
