import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, of} from "rxjs";
import {Listing} from "../models/listing";
import {environment} from "../../environments/environment";
import {User} from "../models/user";
import {Sale} from "../models/sale";

const endpoint = `${environment.backend.baseURL}/api/user`

@Injectable({
  providedIn: 'root'
})
export class ReportService {

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
