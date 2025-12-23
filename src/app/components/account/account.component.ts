import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChangePasswordComponent } from '../change-password/change-password.component';
import { AuthService } from '../../services/auth.service';
import { StripeService } from '../../services/stripe.service';
import { BillingService, CheckoutPrice, CurrentSubscriptionResponse, ChangeSubscriptionResponse, UpcomingInvoiceResponse } from '../../services/billing.service';
import { StripeJsService } from '../../services/stripe-js.service';
import { CurrencyService } from '../../services/currency.service';
import { ThemeService } from '../../services/theme.service';
import { UserService } from '../../services/user.service';
import { FeatureFlagService } from '../../services/feature-flag.service';
import { QuickBooksService } from '../../services/quickbooks.service';
import { UpgradeService } from '../../services/upgrade.service';
import { lastValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ChangePasswordComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent implements OnInit, OnDestroy {
  userEmail: string = '';
  isLoading: boolean = false;
  selectedCurrency: string = 'GBP';
  isCurrencyUpdating: boolean = false;
  isDarkMode: boolean = false;
  experimentalFeatures: boolean = false;
  isExperimentalFeaturesUpdating: boolean = false;
  // Sales tax display preference
  showSalesTaxEnabled: boolean = false;

  // Subscription status
  hasActiveSubscription: boolean | null = null; // null = unknown/loading
  isCheckingSubscription = false;
  // On-site subscription management state
  manageLoading = false;
  manageError: string | null = null;
  manageSuccess: string | null = null;
  isCancelling = false;
  isResuming = false;
  isChangingPlan: 'monthly' | 'annual' | null = null;
  currentSubscription: CurrentSubscriptionResponse['subscription'] | null = null;
  priceMonthly: CheckoutPrice | null = null;
  priceAnnual: CheckoutPrice | null = null;
  // Addon pricing
  addonMonthly: CheckoutPrice | null = null;
  addonAnnual: CheckoutPrice | null = null;
  // Upcoming invoice summary
  upcoming: UpcomingInvoiceResponse | null = null;

  // QuickBooks integration
  isQuickBooksConnected: boolean = false;
  isQuickBooksLoading: boolean = false;
  isQuickBooksSyncing: boolean = false;
  quickBooksCompanyId: string | null = null;
  isQuickBooksTokenValid: boolean = false;
  quickBooksTokenExpiresIn: number | null = null;
  quickBooksStatusMessage: string | null = null;

  // Timer for refreshing QuickBooks token status
  private tokenStatusRefreshInterval: any;

  // Services via inject() where appropriate
  readonly upgradeService = inject(UpgradeService);
  private readonly billing = inject(BillingService);
  private readonly stripeJs = inject(StripeJsService);

  // Feature flags
  readonly addonsEnabled = environment.addonsEnabled;

  constructor(
    private authService: AuthService,
    private stripeService: StripeService,
    public currencyService: CurrencyService,
    public themeService: ThemeService,
    private userService: UserService,
    public featureFlagService: FeatureFlagService,
    private quickBooksService: QuickBooksService
  ) {
    const user = this.authService.getSignedInUser();
    if (user && user.email) {
      this.userEmail = user.email;
    }

    // Get the current user data from UserService
    const currentUser = this.userService.getCurrentUser();
    if (currentUser) {
      if (currentUser.currency) {
        this.selectedCurrency = currentUser.currency;
      }
      if (currentUser.experimental_features !== undefined) {
        this.experimentalFeatures = currentUser.experimental_features;
      }
    }

    // Subscribe to user changes
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        if (user.currency) {
          this.selectedCurrency = user.currency;
        }
        if (user.experimental_features !== undefined) {
          this.experimentalFeatures = user.experimental_features;
        }
      }

      // Re-evaluate subscription status when user data changes
      this.checkSubscriptionStatus();
    });

    // Initialize dark mode state
    this.isDarkMode = this.themeService.getCurrentTheme();
    this.themeService.isDarkMode().subscribe(isDark => {
      this.isDarkMode = isDark;
    });

    // Initialize experimental features state
    this.experimentalFeatures = this.featureFlagService.getExperimentalFeaturesEnabled();
    this.featureFlagService.isExperimentalFeaturesEnabled().subscribe(enabled => {
      this.experimentalFeatures = enabled;
    });

    // Initialize show sales tax preference
    this.showSalesTaxEnabled = this.userService.getShowSalesTaxEnabled();
    this.userService.isShowSalesTaxEnabled().subscribe(enabled => {
      this.showSalesTaxEnabled = enabled;
    });

    // Initial check of QuickBooks connection status will be done in ngOnInit
  }

  ngOnInit(): void {
    // Check QuickBooks connection status
    // this.checkQuickBooksConnectionStatus();

    // Start periodic refresh of token status
    // this.startTokenStatusRefresh();

    // Determine subscription status initially
    this.checkSubscriptionStatus();
    this.loadSubscriptionManagementData();
  }

  onOpenUpgrade(): void {
    this.upgradeService.open('account');
  }

  onToggleShowSalesTax(): void {
    this.userService.setShowSalesTaxEnabled(this.showSalesTaxEnabled);
  }

  /**
   * Determines whether the current user already has an active subscription.
   * Uses Stripe-backed billing endpoint; considers trialing as active for gating.
   */
  private checkSubscriptionStatus(): void {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) {
      this.hasActiveSubscription = null;
      return;
    }

    // Query backend/Stripe (source of truth)
    this.isCheckingSubscription = true;
    this.billing.getCurrentSubscription().subscribe({
      next: (resp) => {
        const sub = resp?.subscription ?? null;
        const status = sub?.status ?? null;
        this.hasActiveSubscription = !!sub && (status === 'active' || status === 'trialing');
        this.isCheckingSubscription = false;
      },
      error: () => {
        // On error, assume no active subscription to allow upgrade path
        this.hasActiveSubscription = false;
        this.isCheckingSubscription = false;
      },
    });
  }

  private async loadSubscriptionManagementData() {
    this.manageError = null;
    this.manageSuccess = null;
    try {
      // Load current subscription summary
      const subResp = await lastValueFrom(this.billing.getCurrentSubscription());
      this.currentSubscription = subResp?.subscription ?? null;

      // Load available prices for plan switch labels
      const products = await lastValueFrom(this.billing.getCheckoutProducts());
      this.priceMonthly = products.analytics.prices.monthly;
      this.priceAnnual = products.analytics.prices.annual;
      if (this.addonsEnabled) {
        const addon = products.addons?.advancedAnalytics?.prices;
        if (addon) {
          this.addonMonthly = addon.monthly;
          this.addonAnnual = addon.annual;
        } else {
          this.addonMonthly = null;
          this.addonAnnual = null;
        }
      } else {
        this.addonMonthly = null;
        this.addonAnnual = null;
      }

      // Load upcoming invoice to determine next renewal date/amount
      try {
        this.upcoming = await lastValueFrom(this.billing.getUpcomingInvoice());
      } catch (e) {
        // Non-fatal; keep upcoming as null
        this.upcoming = null;
      }
    } catch (e) {
      // Keep silent error; UI will hide management panel if data missing
      console.error('Failed to load subscription management data', e);
      this.manageError = 'Unable to load subscription details right now.';
    }
  }

  get hasAdvancedAnalyticsAddon(): boolean {
    const names = (this.currentSubscription as any)?.addon_names as string[] | undefined;
    return Array.isArray(names) ? names.includes('Advanced Analytics') : false;
  }

  async onAddAdvancedAnalytics() {
    if (!this.addonsEnabled) return;
    try {
      this.manageError = null;
      this.manageLoading = true;
      // choose addon price by current interval
      const interval = this.planInterval;
      const priceId = interval === 'annual' ? this.addonAnnual?.id : this.addonMonthly?.id;
      if (!priceId) throw new Error('Addon price not available');

      const resp = await lastValueFrom(this.billing.addAddon(priceId));

      // If payment is required, confirm invoice payment
      const clientSecret = resp.clientSecret ?? null;
      if (clientSecret) {
        const stripe = await this.stripeJs.getStripe();
        if (!stripe) throw new Error('Stripe failed to load');
        const result = await (stripe as any).confirmInvoicePayment(clientSecret, {
          return_url: `${window.location.origin}/account?source=stripe`,
        });
        if ((result as any)?.error) {
          throw new Error((result as any).error.message || 'Payment authorization failed');
        }
      }

      await this.loadSubscriptionManagementData();
      this.manageSuccess = 'Advanced Analytics has been added to your subscription.';
    } catch (e: any) {
      this.manageError = e?.message || 'Unable to add Advanced Analytics right now.';
    } finally {
      this.manageLoading = false;
    }
  }

  async onRemoveAdvancedAnalytics() {
    if (!this.addonsEnabled) return;
    try {
      this.manageError = null;
      this.manageLoading = true;
      // choose addon price by current interval (removal matches by price id in subscription)
      const interval = this.planInterval;
      const priceId = interval === 'annual' ? this.addonAnnual?.id : this.addonMonthly?.id;
      if (!priceId) throw new Error('Addon price not available');

      const resp = await lastValueFrom(this.billing.removeAddon(priceId));
      const clientSecret = resp.clientSecret ?? null;
      if (clientSecret) {
        const stripe = await this.stripeJs.getStripe();
        if (!stripe) throw new Error('Stripe failed to load');
        const result = await (stripe as any).confirmInvoicePayment(clientSecret, {
          return_url: `${window.location.origin}/account?source=stripe`,
        });
        if ((result as any)?.error) {
          throw new Error((result as any).error.message || 'Payment authorization failed');
        }
      }

      await this.loadSubscriptionManagementData();
      this.manageSuccess = 'Advanced Analytics has been removed from your subscription.';
    } catch (e: any) {
      this.manageError = e?.message || 'Unable to remove Advanced Analytics right now.';
    } finally {
      this.manageLoading = false;
    }
  }

  get planInterval(): 'monthly' | 'annual' | null {
    const interval = this.currentSubscription?.price?.interval;
    if (interval === 'month') return 'monthly';
    if (interval === 'year') return 'annual';
    return null;
  }

  get nextRenewalEpoch(): number | null {
    const periodEnd = this.currentSubscription?.current_period_end ?? null;
    if (periodEnd) return periodEnd;
    const up = this.upcoming;
    if (up && (up as any).hasUpcoming === true) {
      const u = up as Extract<UpcomingInvoiceResponse, { hasUpcoming: true }>;
      return u.period_end ?? null;
    }
    return null;
  }

  get nextAmountDueLabel(): string | null {
    const up = this.upcoming;
    if (up && (up as any).hasUpcoming === true) {
      const u = up as Extract<UpcomingInvoiceResponse, { hasUpcoming: true }>;
      const total = u.total;
      const currency = (u.currency || 'gbp').toUpperCase();
      const amount = (total ?? 0) / 100;
      try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
      } catch {
        return amount.toFixed(2) + ' ' + currency;
      }
    }
    return null;
  }

  formatAmount(price: CheckoutPrice | null): string {
    if (!price || price.unit_amount == null) return '';
    const amount = price.unit_amount / 100;
    const currency = (price.currency || 'gbp').toUpperCase();
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
    } catch {
      return amount.toFixed(2) + ' ' + currency;
    }
  }

  async onCancelAtPeriodEnd() {
    this.manageLoading = true;
    this.isCancelling = true;
    this.manageError = null;
    this.manageSuccess = null;
    try {
      await lastValueFrom(this.billing.cancelSubscription());
      await this.loadSubscriptionManagementData();
      this.manageSuccess = 'Subscription will cancel at the end of the current period.';
    } catch (e) {
      console.error(e);
      this.manageError = 'Could not cancel the subscription. Please try again.';
    } finally {
      this.manageLoading = false;
      this.isCancelling = false;
      setTimeout(() => (this.manageSuccess = null), 4000);
    }
  }

  async onResume() {
    this.manageLoading = true;
    this.isResuming = true;
    this.manageError = null;
    this.manageSuccess = null;
    try {
      await lastValueFrom(this.billing.resumeSubscription());
      await this.loadSubscriptionManagementData();
      this.manageSuccess = 'Subscription has been set to renew at the end of the period.';
    } catch (e) {
      console.error(e);
      this.manageError = 'Could not resume the subscription. Please try again.';
    } finally {
      this.manageLoading = false;
      this.isResuming = false;
      setTimeout(() => (this.manageSuccess = null), 4000);
    }
  }

  async onChangePlan(target: 'monthly' | 'annual') {
    if (!this.priceMonthly || !this.priceAnnual) return;
    const priceId = target === 'monthly' ? this.priceMonthly.id : this.priceAnnual.id;
    this.manageLoading = true;
    this.isChangingPlan = target;
    this.manageError = null;
    this.manageSuccess = null;
    try {
      const resp = await lastValueFrom(
        this.billing.changeSubscription({ priceId, proration_behavior: 'create_prorations', source: 'account_billing' })
      ) as ChangeSubscriptionResponse;
      // If payment required, confirm any next actions
      if (resp?.clientSecret) {
        const stripe = await this.stripeJs.getStripe();
        if (!stripe) throw new Error('Stripe failed to load');
        const result = await stripe.confirmCardPayment(resp.clientSecret);
        if (result.error) {
          throw new Error(result.error.message || 'Payment confirmation failed');
        }
      }
      await this.loadSubscriptionManagementData();
      this.manageSuccess = `Plan changed to ${target === 'monthly' ? 'Monthly' : 'Annual'}.`;
    } catch (e) {
      console.error(e);
      this.manageError = 'Could not change plan. Please try again.';
    } finally {
      this.manageLoading = false;
      this.isChangingPlan = null;
      setTimeout(() => (this.manageSuccess = null), 4000);
    }
  }

  ngOnDestroy(): void {
    // Clean up the refresh interval when component is destroyed
    // this.stopTokenStatusRefresh();
  }

  /**
   * Starts periodic refresh of QuickBooks token status
   * Checks every 5 minutes (300000 ms)
   */
  startTokenStatusRefresh(): void {
    // Clear any existing interval
    this.stopTokenStatusRefresh();

    // Set up new interval (every 5 minutes)
    this.tokenStatusRefreshInterval = setInterval(() => {
      console.log('Refreshing QuickBooks token status...');
      this.checkQuickBooksConnectionStatus();
    }, 300000); // 5 minutes
  }

  /**
   * Stops periodic refresh of QuickBooks token status
   */
  stopTokenStatusRefresh(): void {
    if (this.tokenStatusRefreshInterval) {
      clearInterval(this.tokenStatusRefreshInterval);
      this.tokenStatusRefreshInterval = null;
    }
  }

  /**
   * Toggles between light and dark mode
   */
  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  /**
   * Redirects the user to the Stripe billing portal
   */
  goToStripeBillingPortal(): void {
    this.isLoading = true;

    const user = this.authService.getSignedInUser();
    if (!user) {
      console.error('No user is signed in');
      this.isLoading = false;
      return;
    }

    // Set the return URL to the current page (account page)
    const returnUrl = window.location.origin + '/account';

    try {
      // Re-enable redirect to Stripe Billing Portal
      this.stripeService.redirectToBillingPortal(user.uid, {
        returnUrl,
        source: 'account_billing',
        context: { from: 'account_page' },
      });
      // Note: isLoading will remain true until the page redirects
      // If there's an error, the catch block will set isLoading to false
    } catch (error) {
      console.error('Error redirecting to billing portal:', error);
      this.isLoading = false;
    }
  }

  /**
   * Updates the user's currency preference
   */
  updateCurrency(): void {
    this.isCurrencyUpdating = true;

    this.currencyService.setCurrency(this.selectedCurrency)
      .subscribe({
        next: () => {
          this.isCurrencyUpdating = false;
        },
        error: (error) => {
          this.isCurrencyUpdating = false;
        }
      });
  }

  /**
   * Updates the user's experimental features preference
   */
  updateExperimentalFeatures(): void {
    this.isExperimentalFeaturesUpdating = true;

    // Use the feature flag service to update the experimental features
    this.featureFlagService.setExperimentalFeaturesEnabled(this.experimentalFeatures);

    // The feature flag service handles the API call and localStorage update
    // We just need to update the UI state
    setTimeout(() => {
      this.isExperimentalFeaturesUpdating = false;
    }, 500); // Add a small delay to show the loading state
  }

  /**
   * Checks the QuickBooks connection status for the current user
   */
  checkQuickBooksConnectionStatus(): void {
    const user = this.authService.getSignedInUser();
    if (!user) {
      console.error('No user is signed in');
      return;
    }

    this.isQuickBooksLoading = true;
    this.quickBooksService.getConnectionStatus(user.uid).subscribe({
      next: (response) => {
        // Store basic connection info
        this.isQuickBooksConnected = response.connected;
        this.quickBooksCompanyId = response.companyId;

        // Store enhanced token status info
        this.isQuickBooksTokenValid = response.valid || false;
        this.quickBooksTokenExpiresIn = response.expiresIn || null;
        this.quickBooksStatusMessage = response.message || null;

        console.log('QuickBooks connection status:', response);
        this.isQuickBooksLoading = false;
      },
      error: (error) => {
        console.error('Error checking QuickBooks connection status:', error);
        this.isQuickBooksLoading = false;

        // Reset token status on error
        this.isQuickBooksTokenValid = false;
        this.quickBooksTokenExpiresIn = null;
        this.quickBooksStatusMessage = `Error: ${error.message}`;
      }
    });
  }

  /**
   * Initiates the QuickBooks OAuth flow
   */
  connectToQuickBooks(): void {
    const user = this.authService.getSignedInUser();
    if (!user) {
      console.error('No user is signed in');
      return;
    }

    this.isQuickBooksLoading = true;

    // Reset token status before redirecting
    this.isQuickBooksTokenValid = false;
    this.quickBooksTokenExpiresIn = null;
    this.quickBooksStatusMessage = 'Connecting to QuickBooks...';

    // Redirect to QuickBooks authorization page
    this.quickBooksService.connectToQuickBooks(user.uid);
    // Note: The page will redirect, so we don't need to set isQuickBooksLoading to false

    // When the user returns after authorization, the token status will be refreshed
    // via the periodic refresh that was set up in ngOnInit
  }

  /**
   * Syncs sales data to QuickBooks
   */
  syncSalesToQuickBooks(): void {
    const user = this.authService.getSignedInUser();
    if (!user) {
      console.error('No user is signed in');
      return;
    }

    // Check if token is valid before attempting to sync
    if (!this.isQuickBooksConnected || !this.isQuickBooksTokenValid) {
      console.error('Cannot sync sales: QuickBooks token is invalid or missing');
      // Refresh the token status to get the latest information
      this.checkQuickBooksConnectionStatus();
      return;
    }

    this.isQuickBooksSyncing = true;
    this.quickBooksService.syncSalesToQuickBooks(user.uid).subscribe({
      next: (response) => {
        console.log('Sales synced successfully:', response);
        this.isQuickBooksSyncing = false;

        // Refresh token status after successful sync
        this.checkQuickBooksConnectionStatus();
      },
      error: (error) => {
        console.error('Error syncing sales to QuickBooks:', error);
        this.isQuickBooksSyncing = false;

        // Refresh token status after error to check if it's a token issue
        this.checkQuickBooksConnectionStatus();
      }
    });
  }

  /**
   * Syncs listings data to QuickBooks
   */
  syncListingsToQuickBooks(): void {
    const user = this.authService.getSignedInUser();
    if (!user) {
      console.error('No user is signed in');
      return;
    }

    // Check if token is valid before attempting to sync
    if (!this.isQuickBooksConnected || !this.isQuickBooksTokenValid) {
      console.error('Cannot sync listings: QuickBooks token is invalid or missing');
      // Refresh the token status to get the latest information
      this.checkQuickBooksConnectionStatus();
      return;
    }

    this.isQuickBooksSyncing = true;
    this.quickBooksService.syncListingsToQuickBooks(user.uid).subscribe({
      next: (response) => {
        console.log('Listings synced successfully:', response);
        this.isQuickBooksSyncing = false;

        // Refresh token status after successful sync
        this.checkQuickBooksConnectionStatus();
      },
      error: (error) => {
        console.error('Error syncing listings to QuickBooks:', error);
        this.isQuickBooksSyncing = false;

        // Refresh token status after error to check if it's a token issue
        this.checkQuickBooksConnectionStatus();
      }
    });
  }
}
