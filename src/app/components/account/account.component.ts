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

  constructor(
    private authService: AuthService,
    private stripeService: StripeService,
    public currencyService: CurrencyService,
    public themeService: ThemeService,
    private userService: UserService,
    public featureFlagService: FeatureFlagService
  ) {
    const user = this.authService.getSignedInUser();
    if (user && user.email) {
      this.userEmail = user.email;
    }

    // Get the current currency from localStorage or user object
    const dbUserStr = localStorage.getItem('dbUser');
    if (dbUserStr) {
      try {
        const dbUser = JSON.parse(dbUserStr);
        if (dbUser && dbUser.currency) {
          this.selectedCurrency = dbUser.currency;
        }
        if (dbUser && dbUser.experimental_features !== undefined) {
          this.experimentalFeatures = dbUser.experimental_features;
        }
      } catch (e) {
        console.error('Error parsing dbUser from localStorage', e);
      }
    }

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
}
