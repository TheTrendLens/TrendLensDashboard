import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {Sale} from "../models/sale";
import {AuthService} from "./auth.service";

const endpoint = `${environment.backend.baseURL}/api/sale`

@Injectable({
  providedIn: 'root'
})
export class SaleService {

  constructor(private http: HttpClient, private auth: AuthService) { }

  getAll(): Observable<Sale[]> {
    return this.http.get<Sale[]>(endpoint);
  }

  get(id: any): Observable<Sale> {
    return this.http.get<Sale>(`${endpoint}/${id}`);
  }

  findByUser(user: string): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${endpoint}/user/${user}`);
  }

  create(sale: Sale): Observable<any> {
    return this.http.post(endpoint, JSON.stringify(sale));
  }

  update(id: any, data: any): Observable<any> {
    console.log(data);
    return this.http.put(`${endpoint}/${id}`, data);
  }
}
