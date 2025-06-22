import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Subscription} from '../models/subscription';

const endpoint = `${environment.backend.baseURL}/api/stripe`

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  constructor(private http: HttpClient) { }

  getSubscriptionStatus(userId: string): Observable<Subscription> {
    return this.http.get<Subscription>(`${endpoint}/get-stripe-subscription-status/${userId}`);
  }

  createCustomerSession(userId: string): Observable<string> {
    return this.http.get<string>(`${endpoint}/createCustomerSession/${userId}`);
  }
}
