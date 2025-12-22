import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Subscription } from '../models/subscription';

const endpoint = `${environment.backend.baseURL}/api/stripe`

@Injectable({
  providedIn: 'root'
})
export class StripeService {
  constructor(private http: HttpClient) { }

  getSubscriptionStatus(userId: string): Observable<Subscription> {
    return this.http.get<Subscription>(`${endpoint}/get-stripe-subscription-status/${userId}`);
  }

  /**
   * Initiates a Stripe checkout/billing session.
   * Note: `userId` is currently unused by the backend endpoint but kept for compatibility.
   * The optional `options.source` allows attributing where the upgrade was initiated.
   */
  createCustomerSession(
    userId: string,
    options?: { source?: string; context?: unknown }
  ): Observable<string> {
    const params: string[] = [];
    if (options?.source) {
      params.push(`source=${encodeURIComponent(options.source)}`);
    }
    // If we later want to pass a small context payload, keep it compact and URL-safe
    if (options?.context) {
      try {
        const ctx = encodeURIComponent(btoa(JSON.stringify(options.context)));
        params.push(`context=${ctx}`);
      } catch {
        // ignore context if it cannot be serialized
      }
    }
    const url = params.length
      ? `${endpoint}/createCustomerSession?${params.join('&')}`
      : `${endpoint}/createCustomerSession`;
    return this.http.get<string>(url);
  }

  /**
   * Creates a Stripe billing portal session and redirects the user to it
   * @param userId The user ID
   * @param options Optional options: returnUrl for after exiting portal, source/context for attribution
   */
  redirectToBillingPortal(
    userId: string,
    options?: { returnUrl?: string; source?: string; context?: unknown }
  ): void {
    const params: string[] = [];
    if (options?.returnUrl) params.push(`returnUrl=${encodeURIComponent(options.returnUrl)}`);
    if (options?.source) params.push(`source=${encodeURIComponent(options.source)}`);
    if (options?.context) {
      try {
        const ctx = encodeURIComponent(btoa(JSON.stringify(options.context)));
        params.push(`context=${ctx}`);
      } catch {
        // ignore context if it cannot be serialized
      }
    }

    const url = params.length
      ? `${endpoint}/createBillingPortalSession?${params.join('&')}`
      : `${endpoint}/createBillingPortalSession`;

    this.http.get(url, { responseType: 'text' }).subscribe({
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
