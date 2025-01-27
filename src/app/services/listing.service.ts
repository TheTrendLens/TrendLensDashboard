import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Listing} from "../models/listing";
import {environment} from "../../environments/environment";

const endpoint = `${environment.backend.baseURL}/api/listing`

@Injectable({
  providedIn: 'root'
})
export class ListingService {

  constructor(private http: HttpClient) { }

  getAll(): Observable<Listing[]> {
    return this.http.get<Listing[]>(endpoint);
  }

  get(id: any): Observable<Listing> {
    return this.http.get<Listing>(`${endpoint}/${id}`);
  }

  findByUser(user: string): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${endpoint}/user/${user}`);
  }

  save(listing: Listing): Observable<any> {
    return this.http.post(endpoint, JSON.stringify(listing));
  }

  update(id: any, data: any): Observable<any> {
    console.log(data);
    return this.http.put(`${endpoint}/${id}`, data);
  }
}
