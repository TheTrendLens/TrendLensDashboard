import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Listing} from "../models/listing";
import {environment} from "../../environments/environment";
import {User} from "../models/user";

const endpoint = `${environment.backend.baseURL}/api/users`

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(endpoint);
  }

  get(id: any): Observable<User> {
    return this.http.get<User>(`${endpoint}/${id}`);
  }

  create(listing: User): Observable<any> {
    return this.http.post(endpoint, JSON.stringify(listing));
  }

  update(id: any, data: any): Observable<any> {
    return this.http.put(`${endpoint}/${id}`, data);
  }
}
