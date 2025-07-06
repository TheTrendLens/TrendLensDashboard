import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Sale } from '../models/sale';

const endpoint = `${environment.backend.baseURL}/api/sales`;

@Injectable({
  providedIn: 'root'
})
export class SalesService {

  constructor(private http: HttpClient) { }

  getAll(): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${endpoint}`);
  }

  deleteAll(): Observable<any> {
    return this.http.get(`${endpoint}/deleteAll`);
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
