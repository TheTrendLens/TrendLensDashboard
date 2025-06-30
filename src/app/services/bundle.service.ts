import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {Sale} from '../models/sale';
import {Bundle} from '../models/bundle';

const endpoint = `${environment.backend.baseURL}/api/bundle`

@Injectable({
  providedIn: 'root'
})
export class BundleService {

  constructor(private http: HttpClient) { }

  update(data: Bundle): Observable<Bundle> {
    return this.http.put<Bundle>(`${endpoint}/${data.id}`, data);
  }

  get(bundleId: string): Observable<Bundle> {
    return this.http.get<Bundle>(`${endpoint}/${bundleId}`);
  }

  getSales(bundleId: string): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${endpoint}/${bundleId}/sales`);
  }
}
