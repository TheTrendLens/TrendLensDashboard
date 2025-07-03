import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Listing } from '../models/listing';

const endpoint = `${environment.backend.baseURL}/api/listing`;

@Injectable({
  providedIn: 'root'
})
export class ListingService {

  constructor(private http: HttpClient) { }

  create(listing: Listing): Observable<Listing> {
    return this.http.post<Listing>(`${endpoint}`, listing);
  }

  update(listing: Listing): Observable<Listing> {
    return this.http.put<Listing>(`${endpoint}/${listing.id}`, listing);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${endpoint}/${id}`);
  }
}
