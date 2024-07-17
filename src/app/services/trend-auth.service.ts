import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {User} from "../models/user";

const endpoint = `${environment.backend.baseURL}/auth`

@Injectable({
  providedIn: 'root'
})
export class TrendAuthService {

  constructor(private http: HttpClient) { }

  login(id: any): Observable<any> {
    return this.http.post(`${endpoint}/login/`, { user_id: id });
  }
}
