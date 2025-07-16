import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangePasswordComponent } from '../change-password/change-password.component';
import { AuthService } from '../../services/auth.service';
import { StripeService } from '../../services/stripe.service';
import { CurrencyService } from '../../services/currency.service';
import { ThemeService } from '../../services/theme.service';
import { UserService } from '../../services/user.service';
import { FeatureFlagService } from '../../services/feature-flag.service';
import { QuickBooksService } from '../../services/quickbooks.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, ChangePasswordComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent {
  userEmail: string = '';
  isLoading: boolean = false;
  selectedCurrency: string = 'GBP';
  isCurrencyUpdating: boolean = false;
  isDarkMode: boolean = false;
  experimentalFeatures: boolean = false;
  isExperimentalFeaturesUpdating: boolean = false;

  // QuickBooks integration
  isQuickBooksConnected: boolean = false;
  isQuickBooksLoading: boolean = false;
  isQuickBooksSyncing: boolean = false;
  quickBooksCompanyId: string | null = null;

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

    // Check QuickBooks connection status
    this.checkQuickBooksConnectionStatus();
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
      this.stripeService.redirectToBillingPortal(user.uid, returnUrl);
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
          console.log('Currency updated successfully');
          this.isCurrencyUpdating = false;
        },
        error: (error) => {
          console.error('Error updating currency:', error);
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
        this.isQuickBooksConnected = response.connected;
        this.quickBooksCompanyId = response.companyId;
        this.isQuickBooksLoading = false;
      },
      error: (error) => {
        console.error('Error checking QuickBooks connection status:', error);
        this.isQuickBooksLoading = false;
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
    this.quickBooksService.connectToQuickBooks(user.uid);
    // Note: The page will redirect, so we don't need to set isQuickBooksLoading to false
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

    this.isQuickBooksSyncing = true;
    this.quickBooksService.syncSalesToQuickBooks(user.uid).subscribe({
      next: (response) => {
        console.log('Sales synced successfully:', response);
        this.isQuickBooksSyncing = false;
      },
      error: (error) => {
        console.error('Error syncing sales to QuickBooks:', error);
        this.isQuickBooksSyncing = false;
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

    this.isQuickBooksSyncing = true;
    this.quickBooksService.syncListingsToQuickBooks(user.uid).subscribe({
      next: (response) => {
        console.log('Listings synced successfully:', response);
        this.isQuickBooksSyncing = false;
      },
      error: (error) => {
        console.error('Error syncing listings to QuickBooks:', error);
        this.isQuickBooksSyncing = false;
      }
    });
  }
}
