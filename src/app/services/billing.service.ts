import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

type CreateSubscriptionRequest = {
  priceId: string;
  source?: string;
  context?: unknown;
};

export type CreateSubscriptionResponse = {
  clientSecret: string;
  subscriptionId: string;
};

export type CheckoutPrice = {
  id: string;
  unit_amount: number | null; // minor units when not null
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year';
};

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  readonly endpoint = `${environment.backend.baseURL}/api/stripe`;

  getCheckoutProducts() {
    return this.http.get<{
      analytics: {
        name: string;
        prices: { monthly: CheckoutPrice; annual: CheckoutPrice };
        currency: string;
        intervalLabels: { monthly: string; annual: string };
      };
      supports: { cards: boolean; wallets: string[] };
      live: boolean;
    }>(`${this.endpoint}/checkoutProducts`);
  }

  createSubscription(body: CreateSubscriptionRequest) {
    return this.http.post<CreateSubscriptionResponse>(`${this.endpoint}/subscriptions/create`, body);
  }
}
