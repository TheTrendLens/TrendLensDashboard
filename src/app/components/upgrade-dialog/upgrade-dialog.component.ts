import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalShellComponent } from '../common/modal-shell/modal-shell.component';
import { StripeService } from '../../services/stripe.service';
import { AuthService } from '../../services/auth.service';
import { UpgradeService } from '../../services/upgrade.service';

@Component({
  selector: 'app-upgrade-dialog',
  standalone: true,
  imports: [CommonModule, ModalShellComponent],
  template: `
    <app-modal-shell
      [title]="'Upgrade to Analytics'"
      [open]="isOpen()"
      [size]="'lg'"
      (closed)="onClose()"
    >
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Unlock Analytics</h3>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">Get access to Analytics dashboards, deeper sales insights, and smarter decision‑making tools.</p>
        </div>

        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <li class="flex items-start gap-2">
            <span class="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-brand-100 text-brand-600">✓</span>
            <span class="text-sm text-gray-700 dark:text-gray-300">Analytics dashboards and reports</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-brand-100 text-brand-600">✓</span>
            <span class="text-sm text-gray-700 dark:text-gray-300">Category and brand insights</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-brand-100 text-brand-600">✓</span>
            <span class="text-sm text-gray-700 dark:text-gray-300">Advanced filters and comparisons</span>
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-brand-100 text-brand-600">✓</span>
            <span class="text-sm text-gray-700 dark:text-gray-300">Forecasting and trends</span>
          </li>
        </ul>

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-md border border-gray-200 dark:border-gray-700 p-4">
          <div>
            <div class="text-base font-semibold text-gray-900 dark:text-gray-100">Analytics</div>
            <div class="text-sm text-gray-600 dark:text-gray-300">Powerful insights for your business.</div>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="button"
              (click)="onUpgrade()"
              [disabled]="isLoading()"
              class="inline-flex items-center rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-70"
            >
              <svg *ngIf="isLoading()" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {{ isLoading() ? 'Redirecting…' : 'Upgrade to Analytics' }}
            </button>
            <button
              type="button"
              (click)="onClose()"
              class="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-brand-600 ring-1 ring-inset ring-brand-300 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:bg-gray-900 dark:text-brand-400 dark:ring-brand-700"
            >
              Not now
            </button>
          </div>
        </div>

        <p *ngIf="error()" class="text-sm text-red-600">{{ error() }}</p>
      </div>
    </app-modal-shell>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpgradeDialogComponent {
  private readonly stripe = inject(StripeService);
  private readonly auth = inject(AuthService);
  readonly upgradeService = inject(UpgradeService);

  readonly isOpen = this.upgradeService.isOpen;
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  onClose() {
    if (!this.isLoading()) this.upgradeService.close();
  }

  onUpgrade() {
    const user = this.auth.getSignedInUser();
    if (!user) {
      this.error.set('You must be signed in to upgrade.');
      return;
    }
    this.error.set(null);
    this.isLoading.set(true);
    this.stripe.createCustomerSession(user.uid, { source: this.upgradeService.source() ?? undefined }).subscribe({
      next: (url) => {
        try {
          // Redirect to Stripe Checkout/Portal URL
          window.location.href = url as unknown as string;
        } finally {
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.error.set('We could not start the checkout. Please try again.');
        this.isLoading.set(false);
      }
    });
  }
}
