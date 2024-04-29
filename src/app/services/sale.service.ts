import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {Sale} from "../models/sale";

const endpoint = `${environment.backend.baseURL}/api/sales`

@Injectable({
  providedIn: 'root'
})
export class SaleService {

  constructor(private http: HttpClient) { }

  getAll(): Observable<Sale[]> {
    return this.http.get<Sale[]>(endpoint);
  }

  get(id: any): Observable<Sale> {
    return this.http.get<Sale>(`${endpoint}/${id}`);
  }

  findByUser(user: string): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${endpoint}/users/${user}`);
  }

  create(sale: Sale): Observable<any> {
    return this.http.post(endpoint, JSON.stringify(sale));
  }

  update(id: any, data: any): Observable<any> {
    return this.http.put(`${endpoint}/${id}`, data);
  }
}
