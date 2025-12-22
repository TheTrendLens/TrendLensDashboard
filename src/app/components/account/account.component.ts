import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChangePasswordComponent } from '../change-password/change-password.component';
import { AuthService } from '../../services/auth.service';
import { StripeService } from '../../services/stripe.service';
import { CurrencyService } from '../../services/currency.service';
import { ThemeService } from '../../services/theme.service';
import { UserService } from '../../services/user.service';
import { FeatureFlagService } from '../../services/feature-flag.service';
import { QuickBooksService } from '../../services/quickbooks.service';
import { UpgradeService } from '../../services/upgrade.service';

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
  }

  onOpenUpgrade(): void {
    this.upgradeService.open('account');
  }

  onToggleShowSalesTax(): void {
    this.userService.setShowSalesTaxEnabled(this.showSalesTaxEnabled);
  }

  /**
   * Determines whether the current user already has an active subscription.
   * Uses local user.active_package first, then falls back to Stripe status check.
   */
  private checkSubscriptionStatus(): void {
    const currentUser = this.userService.getCurrentUser();
    if (!currentUser) {
      this.hasActiveSubscription = null;
      return;
    }

    // If we already know from user object
    if ((currentUser as any).active_package) {
      this.hasActiveSubscription = true;
      return;
    }

    // Otherwise query backend/Stripe
    this.isCheckingSubscription = true;
    this.stripeService.getSubscriptionStatus(currentUser.id).subscribe({
      next: (subscription) => {
        this.hasActiveSubscription = (subscription && (subscription as any).status === 'active');
        this.isCheckingSubscription = false;
      },
      error: () => {
        // On error, assume no active subscription to allow upgrade path
        this.hasActiveSubscription = false;
        this.isCheckingSubscription = false;
      }
    });
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
      // this.stripeService.redirectToBillingPortal(user.uid, returnUrl);
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
