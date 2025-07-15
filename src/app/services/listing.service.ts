import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Listing } from '../models/listing';

const endpoint = `${environment.backend.baseURL}/api/listings`;

export interface PaginatedListings {
  items: Listing[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ListingService {

  constructor(private http: HttpClient) { }

  getListings(
    limit: number = 10,
    page: number = 1,
    query: string = '',
    dateFilter: string = '',
    sortBy: string = 'date_desc'
  ): Observable<PaginatedListings> {
    let params = new HttpParams()
      .set('limit', limit.toString())
      .set('page', page.toString());

    if (query) {
      params = params.set('query', query);
    }

    if (dateFilter) {
      params = params.set('dateFilter', dateFilter);
    }

    if (sortBy) {
      params = params.set('sortBy', sortBy);
    }

    return this.http.get<PaginatedListings>(`${endpoint}`, { params });
  }

  getCategories(): Observable<string[]> {
    return this.http.get<string[]>(`${endpoint}/categories`);
  }

  getBrands(): Observable<string[]> {
    return this.http.get<string[]>(`${endpoint}/brands`);
  }

  getListing(id: string): Observable<Listing> {
    return this.http.get<Listing>(`${endpoint}/${id}`);
  }

  create(listing: Listing): Observable<Listing> {
    return this.http.post<Listing>(`${endpoint}`, listing);
  }

  update(listing: Listing): Observable<Listing> {
    return this.http.post<Listing>(`${endpoint}`, listing);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${endpoint}/${id}`);
  }
}
