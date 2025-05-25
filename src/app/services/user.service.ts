import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, of} from "rxjs";
import {Listing} from "../models/listing";
import {environment} from "../../environments/environment";
import {User} from "../models/user";
import {Sale} from "../models/sale";
import {Report} from "../models/report";


interface StatsResponse {
  date: string;
  [key: string]: string | number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly BASE_URL = `${environment.backend.baseURL}`;
  private readonly API_ENDPOINTS = {
    users: `${this.BASE_URL}/users`,
    listings: `${this.BASE_URL}/users/listings`,
    sales: `${this.BASE_URL}/users/sales`,
    reports: `${this.BASE_URL}/users/reports`,
    stats: `${this.BASE_URL}/users/stats`,
    admin: `${this.BASE_URL}/is-admin`
  };

  constructor(private http: HttpClient) {}

  // User-related methods
  getAll(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_ENDPOINTS.users}/all`);
  }

  get(): Observable<User> {
    return this.http.get<User>(this.API_ENDPOINTS.users);
  }

  create(id: string, email: string): Observable<User> {
    return this.http.post<User>(this.API_ENDPOINTS.users, { id, email });
  }

  update(userId: string, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API_ENDPOINTS.users}/${userId}`, data);
  }

  getActivePackage(userId: string): Observable<Object> {
    return this.http.get(`${this.API_ENDPOINTS.users}/${userId}/subscription`);
  }

  // Listings related methods
  getListings(withMissingData = false): Observable<Listing[]> {
    return this.http.get<Listing[]>(
      this.buildUrl(this.API_ENDPOINTS.listings, { missingData: withMissingData })
    );
  }

  // Sales-related methods
  getSales(withMissingData = false): Observable<Sale[]> {
    return this.http.get<Sale[]>(
      this.buildUrl(this.API_ENDPOINTS.sales, { missingData: withMissingData })
    );
  }

  // Reports related methods
  getReports(): Observable<Report[]> {
    return this.http.get<Report[]>(this.API_ENDPOINTS.reports);
  }

  getReportsByDate(year: number, month: number): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.API_ENDPOINTS.reports}/${year}/${month}`);
  }

  getReportByDateAndType(year: number, month: number, type: string): Observable<Report> {
    return this.http.get<Report>(`${this.API_ENDPOINTS.reports}/${year}/${month}/${type}`);
  }

  // Statistics methods
  getStats(metric: 'profit' | 'costs' | 'revenue' | 'sales', year: number, month: number, day?: number): Observable<StatsResponse> {
    const path = day
      ? `${metric}/${year}/${month}/${day}`
      : `${metric}/${year}/${month}`;
    return this.http.get<StatsResponse>(`${this.API_ENDPOINTS.stats}/${path}`);
  }

  // Authorization methods
  isAdmin(): Observable<boolean> {
    return this.http.get<boolean>(this.API_ENDPOINTS.admin);
  }

  private buildUrl(baseUrl: string, params?: Record<string, boolean | string | number>): string {
    if (!params) return baseUrl;
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, value.toString());
      }
    });
    return `${baseUrl}?${queryParams.toString()}`;
  }
}
