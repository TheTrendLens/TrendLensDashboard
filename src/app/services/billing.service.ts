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

export type CurrentSubscriptionResponse = {
  subscription: null | {
    id: string;
    status: string;
    cancel_at_period_end: boolean;
    current_period_end: number | null; // epoch seconds
    price: null | {
      id: string;
      currency: string | null;
      unit_amount: number | null;
      interval: 'day' | 'week' | 'month' | 'year' | null;
    };
  };
};

export type ChangeSubscriptionRequest = {
  priceId: string;
  proration_behavior?: 'create_prorations' | 'none';
  source?: string;
  context?: unknown;
};

export type ChangeSubscriptionResponse = {
  subscriptionId: string;
  status: string;
  clientSecret?: string | null;
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

  getCurrentSubscription() {
    return this.http.get<CurrentSubscriptionResponse>(`${this.endpoint}/subscriptions/current`);
  }

  changeSubscription(body: ChangeSubscriptionRequest) {
    return this.http.post<ChangeSubscriptionResponse>(`${this.endpoint}/subscriptions/change`, body);
  }

  cancelSubscription() {
    return this.http.post<{ id: string; status: string; cancel_at_period_end: boolean; current_period_end: number | null }>(`${this.endpoint}/subscriptions/cancel`, {});
  }

  resumeSubscription() {
    return this.http.post<{ id: string; status: string; cancel_at_period_end: boolean; current_period_end: number | null }>(`${this.endpoint}/subscriptions/resume`, {});
  }
}
