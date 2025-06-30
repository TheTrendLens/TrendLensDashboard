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

  /**
   * Creates a Stripe billing portal session and redirects the user to it
   * @param userId The user ID
   * @param returnUrl Optional URL to return to after the billing portal session
   */
  redirectToBillingPortal(userId: string, returnUrl?: string): void {
    // Show loading state in the component
    const url = returnUrl ? `${endpoint}/createBillingPortalSession/${userId}?returnUrl=${encodeURIComponent(returnUrl)}` : `${endpoint}/createBillingPortalSession/${userId}`;

    this.http.get<string>(url).subscribe({
      next: (response) => {
        // Redirect to the billing portal
        window.location.href = response;
      },
      error: (error) => {
        console.error('Error creating billing portal session:', error);
      }
    });
  }
}
