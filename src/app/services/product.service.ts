import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../models/product';
import { Sale } from '../models/sale';
import { Listing } from '../models/listing';

const endpoint = `${environment.backend.baseURL}/api/product`;

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(private http: HttpClient) { }

  deleteAll(): Observable<any> {
    return this.http.get(`${endpoint}/deleteAll`);
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${endpoint}/${id}`);
  }

  getProductsBySale(saleId: string): Observable<Product[]> {
    return this.http.get<Product[]>(`${endpoint}/sale/${saleId}`);
  }

  update(data: Product): Observable<Product> {
    return this.http.put<Product>(`${endpoint}/${data.id}`, data);
  }

  create(saleId: string, listingId: string, size: string, itemCost: number): Observable<Product> {
    return this.http.post<Product>(`${endpoint}`, {
      sale: saleId,
      listing: listingId,
      size: size,
      item_cost: itemCost
    });
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${endpoint}/${id}`);
  }
}
