import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, of} from "rxjs";
import {Listing} from "../models/listing";
import {environment} from "../../environments/environment";
import {User} from "../models/user";
import {Sale} from "../models/sale";
import {Report} from "../models/report";

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

  getListings(): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${endpoint}/listings`)
  }

  getSales(): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${endpoint}/sales`)
  }

  getSalesWithMissingData(): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${endpoint}/sales?missingData=true`);
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

  getProfitForDate(year: number, month: number, day: number): Observable<{date: string, profit: number}> {
    console.log(year, month, day);
    return this.http.get<{ date: string, profit: number }>(`${endpoint}/stats/profit/${year}/${month}/${day}`);
  }

  isAdmin(): Observable<boolean> {
    return this.http.get<boolean>(`${environment.backend.baseURL}/is-admin`);
  }

  create(id: string, email: string): Observable<any> {
    return this.http.post(endpoint, {id: id, email: email});
  }

  update(id: any, data: any): Observable<any> {
    return this.http.put(`${endpoint}/${id}`, data);
  }

  getActivePackage(id: any): Observable<Object> {
    return this.http.get(`${endpoint}/${id}/subscription`);
  }
}
