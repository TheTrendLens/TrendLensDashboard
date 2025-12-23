import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

type CreateSubscriptionRequest = {
  priceId: string;
  addonPriceIds?: string[];
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
    product_name?: string | null;
    addon_names?: string[];
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

export type PreviewSubscriptionRequest = {
  priceId: string;
  proration_behavior?: 'create_prorations' | 'none';
};

export type PreviewSubscriptionResponse = {
  currency: string;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  amount_due: number | null;
  has_proration: boolean;
  lines: Array<{
    id: string;
    amount: number;
    currency: string | null;
    description: string | null;
    proration: boolean;
  }>;
};

export type UpcomingInvoiceResponse =
  | {
      hasUpcoming: true;
      subscriptionId: string;
      period_start: number | null;
      period_end: number | null;
      amount_due: number;
      subtotal: number;
      total: number;
      currency: string;
      next_payment_attempt: number | null;
    }
  | { hasUpcoming: false; reason: string };

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
      addons?: {
        advancedAnalytics?: {
          name: string;
          prices: { monthly: CheckoutPrice; annual: CheckoutPrice };
        };
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

  previewSubscriptionChange(body: PreviewSubscriptionRequest) {
    return this.http.post<PreviewSubscriptionResponse>(`${this.endpoint}/subscriptions/preview`, body);
  }

  getUpcomingInvoice() {
    return this.http.get<UpcomingInvoiceResponse>(`${this.endpoint}/subscriptions/upcoming`);
  }

  // Addon management
  addAddon(addonPriceId: string, proration: 'create_prorations' | 'none' = 'create_prorations') {
    return this.http.post<{ subscriptionId: string; status: string; clientSecret?: string | null }>(
      `${this.endpoint}/subscriptions/addons/add`,
      { addonPriceId, proration_behavior: proration }
    );
  }

  removeAddon(addonPriceId: string, proration: 'create_prorations' | 'none' = 'create_prorations') {
    return this.http.post<{ subscriptionId: string; status: string; clientSecret?: string | null }>(
      `${this.endpoint}/subscriptions/addons/remove`,
      { addonPriceId, proration_behavior: proration }
    );
  }

  previewAddon(addonPriceId: string, action: 'add' | 'remove') {
    return this.http.post<PreviewSubscriptionResponse>(
      `${this.endpoint}/subscriptions/addons/preview`,
      { addonPriceId, action }
    );
  }
}
