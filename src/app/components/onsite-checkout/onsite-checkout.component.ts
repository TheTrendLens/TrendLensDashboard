import { ChangeDetectionStrategy, Component, OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingService, CreateSubscriptionResponse, CheckoutPrice } from '../../services/billing.service';
import { StripeJsService } from '../../services/stripe-js.service';
import { ActivatedRoute, Router } from '@angular/router';
import { input } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Stripe, StripeElements } from '@stripe/stripe-js';
import { lastValueFrom } from 'rxjs';

type Interval = 'monthly' | 'annual';

@Component({
  selector: 'app-onsite-checkout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-2xl mx-auto p-6">
      <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Upgrade to Analytics</h1>

      <div class="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm text-gray-700 dark:text-gray-300">Choose your plan</p>
            <div class="mt-2 inline-flex rounded-md ring-1 ring-inset ring-gray-300 dark:ring-gray-700 overflow-hidden">
              <button type="button"
                      (click)="selectInterval('monthly')"
                      [class]="interval() === 'monthly' ? 'px-3 py-1.5 text-sm bg-brand-600 text-white' : 'px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'">
                Monthly
              </button>
              <button type="button"
                      (click)="selectInterval('annual')"
                      [class]="interval() === 'annual' ? 'px-3 py-1.5 text-sm bg-brand-600 text-white' : 'px-3 py-1.5 text-sm bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'">
                Annual
              </button>
            </div>
          </div>
          <div class="text-right">
            <div class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ priceLabel() }}</div>
            <div class="text-xs text-gray-500">{{ priceIntervalLabel() }}</div>
          </div>
        </div>
      </div>

      <div class="mt-6">
        <div id="payment-element" class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900"></div>
        <p *ngIf="error()" class="mt-2 text-sm text-red-600">{{ error() }}</p>
      </div>

      <div class="mt-6 flex items-center gap-3">
        <button type="button"
                (click)="onSubmit()"
                [disabled]="isSubmitting() || !elementsReady()"
                class="inline-flex items-center rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-70">
          <svg *ngIf="isSubmitting()" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isSubmitting() ? 'Processing…' : 'Subscribe to Analytics' }}
        </button>
        <button type="button" (click)="onCancel()" class="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900">Cancel</button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnsiteCheckoutComponent implements OnDestroy {
  private readonly billing = inject(BillingService);
  private readonly stripeJs = inject(StripeJsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  // State
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly products = signal<{ monthly: CheckoutPrice; annual: CheckoutPrice } | null>(null);
  readonly currency = signal<'gbp' | string>('gbp');
  readonly interval = signal<Interval>('monthly');
  readonly clientSecret = signal<string | null>(null);
  readonly elementsReady = signal(false);

  // Stripe runtime
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private mounted = false;

  // Derived labels
  readonly priceIntervalLabel = computed(() => this.interval() === 'monthly' ? 'per month' : 'per year');
  readonly priceLabel = computed(() => {
    const prices = this.products();
    if (!prices) return this.interval() === 'monthly' ? 'Analytics – Monthly' : 'Analytics – Annual';
    const price = this.interval() === 'monthly' ? prices.monthly : prices.annual;
    const amountMinor = price.unit_amount;
    const currency = price.currency?.toUpperCase?.() || 'GBP';
    if (amountMinor == null) return this.interval() === 'monthly' ? 'Analytics – Monthly' : 'Analytics – Annual';
    const amount = amountMinor / 100;
    try {
      const fmt = new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 });
      return `${fmt.format(amount)}`;
    } catch {
      return `${amount.toFixed(2)} ${currency}`;
    }
  });

  constructor() {
    // Read query params for defaults
    const qp = this.route.snapshot.queryParamMap;
    const interval = (qp.get('interval') as Interval) || 'monthly';
    if (interval === 'annual' || interval === 'monthly') this.interval.set(interval);

    this.loadProductsAndInit();
  }

  private async loadProductsAndInit() {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const config = await lastValueFrom(this.billing.getCheckoutProducts());
      const prices = config.analytics.prices;
      this.products.set({ monthly: prices.monthly, annual: prices.annual });
      this.currency.set(config.analytics.currency as any);

      // Load Stripe and mount Payment Element in deferred mode, but provide amount + currency
      // to satisfy Stripe Elements requirements when no clientSecret is supplied.
      const chosen = this.interval() === 'monthly' ? prices.monthly : prices.annual;
      const amountMinor = chosen.unit_amount;
      const currency = (config.analytics.currency || chosen.currency || 'gbp') as string;
      if (amountMinor == null || Number.isNaN(amountMinor)) {
        throw new Error('Missing price amount for selected plan');
      }
      await this.mountPaymentElement(amountMinor, currency);
    } catch (e: unknown) {
      this.error.set('We could not start the checkout. Please try again.');
      // log silently
      // eslint-disable-next-line no-console
      console.error('Onsite checkout init error', e);
    } finally {
      this.isLoading.set(false);
      this.cdr.markForCheck();
    }
  }

  selectInterval(next: Interval) {
    if (this.interval() === next) return;
    this.interval.set(next);
    // Deferred flow: do not create a subscription yet. We only create on submit.
    // But we should remount Elements with the new amount so wallets reflect the price.
    this.remountForSelectedPlan();
  }

  private async remountForSelectedPlan() {
    try {
      const prices = this.products();
      if (!prices) return;
      const chosen = this.interval() === 'monthly' ? prices.monthly : prices.annual;
      const amountMinor = chosen.unit_amount;
      const currency = (this.currency() || chosen.currency || 'gbp') as string;
      if (amountMinor == null || Number.isNaN(amountMinor)) return;
      await this.mountPaymentElement(amountMinor, currency);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to remount payment element', e);
    }
  }

  private async mountPaymentElement(amountMinor: number, currency: string) {
    this.elementsReady.set(false);
    await this.teardownElements();
    this.stripe = await this.stripeJs.getStripe();
    if (!this.stripe) throw new Error('Stripe failed to load');
    this.elements = this.stripe.elements({
      mode: 'payment',
      amount: amountMinor,
      currency: currency as any,
    } as any);
    const paymentElement = this.elements.create('payment');
    await paymentElement.mount('#payment-element');
    this.mounted = true;
    this.elementsReady.set(true);
  }

  async onSubmit() {
    if (!this.elements) return;
    this.isSubmitting.set(true);
    this.error.set(null);
    try {
      // Create the subscription only now (on submit)
      const prices = this.products();
      if (!prices) throw new Error('Prices not loaded');
      const priceId = this.interval() === 'monthly' ? prices.monthly.id : prices.annual.id;
      const source = this.route.snapshot.queryParamMap.get('source') ?? undefined;

      const resp = await lastValueFrom(
        this.billing.createSubscription({ priceId, source })
      ) as CreateSubscriptionResponse;

      this.clientSecret.set(resp.clientSecret);

      // Remount Elements with the clientSecret to align with Stripe's recommendation
      this.elementsReady.set(false);
      await this.teardownElements();
      if (!this.stripe) this.stripe = await this.stripeJs.getStripe();
      if (!this.stripe) throw new Error('Stripe failed to load');
      this.elements = this.stripe.elements({ clientSecret: resp.clientSecret });
      const paymentElement = this.elements.create('payment');
      await paymentElement.mount('#payment-element');
      this.mounted = true;
      this.elementsReady.set(true);

      const { error } = await this.stripe.confirmPayment({
        elements: this.elements,
        clientSecret: resp.clientSecret,
        redirect: 'if_required',
      });

      if (error) {
        this.error.set(error.message ?? 'Payment failed. Please check your details and try again.');
        return;
      }

      // Success (succeeded or processing). Poll until subscription becomes active/trialing.
      const ok = await this.pollForActivation(45_000, 2_000);
      if (!ok) {
        // If still not active, guide the user but allow navigation
        this.error.set('Payment is processing. Your subscription will activate shortly.');
      }
      await this.router.navigate(['/account']);
    } catch (e) {
      this.error.set('Payment could not be completed. Please try again.');
      console.error(e);
    } finally {
      this.isSubmitting.set(false);
      this.cdr.markForCheck();
    }
  }

  onCancel() {
    this.router.navigate(['/analytics']);
  }

  private async teardownElements() {
    if (this.elements && this.mounted) {
      try {
        // Unmount all elements
        const el = document.getElementById('payment-element');
        if (el) el.innerHTML = '';
      } catch {}
      this.mounted = false;
    }
  }

  async ngOnDestroy() {
    await this.teardownElements();
  }

  private async pollForActivation(timeoutMs: number, intervalMs: number): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const resp = await lastValueFrom(this.billing.getCurrentSubscription());
        const sub = resp?.subscription ?? null;
        if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
          return true;
        }
      } catch {
        // ignore and retry
      }
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    return false;
  }
}
