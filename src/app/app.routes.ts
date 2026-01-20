import { Routes } from '@angular/router';
import {DashboardLayoutComponent} from './components/dashboard-layout/dashboard-layout.component';
import {
  AuthGuard,
  AuthPipeGenerator,
  redirectLoggedInTo,
  redirectUnauthorizedTo
} from '@angular/fire/auth-guard';
import {map, of, switchMap} from 'rxjs';
import {inject} from '@angular/core';
import {StripeService} from './services/stripe.service';
import {AdminGuard} from './utils/admin.guard';
import {SubscriptionGuard} from './utils/subscription.guard';
const redirectLoggedInToDashboard: AuthPipeGenerator = () => redirectLoggedInTo(['home']);
const authGuardPipe: AuthPipeGenerator = (next, state) => switchMap((user) => {
  return of(user).pipe(
    // Anyone unauthorised gets redirected to the login page
    redirectUnauthorizedTo(['login']),
    map((result) => {
      if (result) {
        if (user) {

          // Step 1: Have they verified their email?
          if (!user.emailVerified) {
            if (state.url === '/signup/verify-email') {
              return true;
            } else {
              return ['/signup/verify-email'];
            }
          }

          // They're trying to access the signup complete page, log them out
          if (state.url === '/signup/complete') {
            return true;
          }

          return true;
        }

        return ['login'];
      } else {
        return false;
      }
    })
  )
})


// Route configuration constants
const AUTH_GUARD_CONFIG = {
    redirectLoggedIn: {
        canActivate: [AuthGuard],
        data: {authGuardPipe: redirectLoggedInToDashboard}
    },
    requireAuth: {
        canActivate: [AuthGuard],
        data: {authGuardPipe: authGuardPipe}
    }
};

const SUBSCRIPTION_GUARD_CONFIG = {
    canActivate: [SubscriptionGuard]
};

const FEATURE_ROUTES = {
    ANALYTICS: 'ANALYTICS_BASE',
    STOCK_ANALYSIS: 'STOCK_ANALYSIS_BASE'
};

// Helper functions for route creation
const createAuthRoute = (path: string, component: any, redirectLoggedIn = false) => ({
    path,
    component,
    ...(redirectLoggedIn ? AUTH_GUARD_CONFIG.redirectLoggedIn : AUTH_GUARD_CONFIG.requireAuth)
});

// Authenticated routes that are part of the free/basic experience should NOT be gated by subscription anymore.
// Premium features should add their own guards (e.g., FeatureAccessGuard) via additionalGuards.
const createProtectedRoute = (path: string, component: any, additionalGuards: any[] = []) => ({
    path,
    component,
    canActivate: [...additionalGuards]
});

const createCheckoutResolver = () => ({
    resolvedData: () => {
        const authUser = JSON.parse(localStorage.getItem('user')!);
        return inject(StripeService).createCustomerSession(authUser.uid);
    }
});

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent),
        ...AUTH_GUARD_CONFIG.redirectLoggedIn
    },
    {
        path: 'forgot-password',
        loadComponent: () => import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        ...AUTH_GUARD_CONFIG.redirectLoggedIn
    },
    {
        path: 'reset-password',
        loadComponent: () => import('./components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
    },
    {
        path: 'auth-action',
        loadComponent: () => import('./components/auth-action/auth-action.component').then(m => m.AuthActionComponent)
    },

    {
        path: 'signup',
        loadComponent: () => import('./components/signup-flow/signup-flow.component').then(m => m.SignupFlowComponent),
        children: [
            {
                path: '',
                loadComponent: () => import('./components/signup/signup.component').then(m => m.SignupComponent),
                ...AUTH_GUARD_CONFIG.redirectLoggedIn
            },
            {
                path: 'verify-email',
                loadComponent: () => import('./components/verify-email/verify-email.component').then(m => m.VerifyEmailComponent),
                ...AUTH_GUARD_CONFIG.requireAuth
            },
            {
                path: 'checkout',
                loadComponent: () => import('./components/checkout/checkout.component').then(m => m.CheckoutComponent),
                ...AUTH_GUARD_CONFIG.requireAuth,
                resolve: createCheckoutResolver()
            },
            {
                path: 'complete',
                loadComponent: () => import('./components/signup-complete/signup-complete.component').then(m => m.SignupCompleteComponent),
                ...AUTH_GUARD_CONFIG.requireAuth
            }
        ]
    },

    {
        path: '',
        component: DashboardLayoutComponent,
        ...AUTH_GUARD_CONFIG.requireAuth,
        children: [
            {
                path: 'home',
                loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent)
            },
            {
                path: 'listings',
                loadComponent: () => import('./components/listings/listings.component').then(m => m.ListingsComponent),
                canActivate: [AdminGuard]
            },
            {
                path: 'sales',
                loadComponent: () => import('./components/sales/sales.component').then(m => m.SalesComponent)
            },
            {
                path: 'sales/:id',
                loadComponent: () => import('./components/sale-detail/sale-detail.component').then(m => m.SaleDetailComponent)
            },
            {
                path: 'analytics',
                loadComponent: () => import('./components/analytics/analytics.component').then(m => m.AnalyticsComponent)
            },
            {
                path: 'ebay',
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./components/ebay-dashboard/ebay-dashboard.component').then(m => m.EbayDashboardComponent)
                    },
                    {
                        path: 'listings',
                        loadComponent: () => import('./components/ebay-listing-analysis/ebay-listing-analysis.component').then(m => m.EbayListingAnalysisComponent)
                    }
                ]
            },
            {
                path: 'checkout',
                loadComponent: () => import('./components/onsite-checkout/onsite-checkout.component').then(m => m.OnsiteCheckoutComponent)
            },
            {
                path: 'sales-upload',
                loadComponent: () => import('./components/sales-upload/sales-upload.component').then(m => m.SalesUploadComponent)
            },
            {
                path: 'account',
                loadComponent: () => import('./components/account/account.component').then(m => m.AccountComponent)
            },
            {
                path: 'admin',
                loadComponent: () => import('./components/admin/admin.component').then(m => m.AdminComponent),
                canActivate: [AdminGuard]
            }
        ]
    },

    {path: '**', redirectTo: ''}
];
