import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Listing} from "../models/listing";
import {environment} from "../../environments/environment";
import {User} from "../models/user";
import {Subscription} from "../models/subscription";

const endpoint = `${environment.backend.baseURL}/api/`

@Injectable({
  providedIn: 'root'
})
export class StripeService {

  constructor(private http: HttpClient) { }

  getSubscriptionStatus(userId: string): Observable<Subscription> {
    return this.http.post<Subscription>(`${endpoint}/get-stripe-subscription-status`, { user_id: userId });
  }
}
