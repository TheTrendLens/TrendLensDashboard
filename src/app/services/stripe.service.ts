import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {Listing} from "../models/listing";
import {environment} from "../../environments/environment";
import {User} from "../models/user";
import {Subscription} from "../models/subscription";
import {ActivatedRoute, ActivatedRouteSnapshot, ResolveFn} from "@angular/router";

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
