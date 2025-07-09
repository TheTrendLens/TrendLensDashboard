import { Routes } from '@angular/router';
import {HomeComponent} from './components/home/home.component';
import {LoginComponent} from './components/login/login.component';
import {DashboardLayoutComponent} from './components/dashboard-layout/dashboard-layout.component';
import {
  AuthGuard,
  AuthPipeGenerator,
  redirectLoggedInTo,
  redirectUnauthorizedTo
} from '@angular/fire/auth-guard';
import {SignupComponent} from './components/signup/signup.component';
import {VerifyEmailComponent} from './components/verify-email/verify-email.component';
import {SignupFlowComponent} from './components/signup-flow/signup-flow.component';
import {map, of, switchMap} from 'rxjs';
import {User as DbUser} from './models/user';
import {CheckoutComponent} from './components/checkout/checkout.component';
import {inject} from '@angular/core';
import {StripeService} from './services/stripe.service';
import {UserService} from './services/user.service';
import {SignupCompleteComponent} from './components/signup-complete/signup-complete.component';
import {ForgotPasswordComponent} from './components/forgot-password/forgot-password.component';
import {ResetPasswordComponent} from './components/reset-password/reset-password.component';
import {AuthActionComponent} from './components/auth-action/auth-action.component';
import {AccountComponent} from './components/account/account.component';
import {SalesComponent} from './components/sales/sales.component';
import {SaleDetailComponent} from './components/sale-detail/sale-detail.component';
import {AnalyticsComponent} from './components/analytics/analytics.component';
import {AdminComponent} from './components/admin/admin.component';
import {AdminGuard} from './utils/admin.guard';
import {SubscriptionGuard} from './utils/subscription.guard';
import {ListingsComponent} from './components/listings/listings.component';
import {FeatureAccessGuard} from './utils/feature-access.guard';
import {SalesUploadComponent} from './components/sales-upload/sales-upload.component';
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
    ANALYTICS: 'ANALYTICS_BASE'
};

// Helper functions for route creation
const createAuthRoute = (path: string, component: any, redirectLoggedIn = false) => ({
    path,
    component,
    ...(redirectLoggedIn ? AUTH_GUARD_CONFIG.redirectLoggedIn : AUTH_GUARD_CONFIG.requireAuth)
});

const createProtectedRoute = (path: string, component: any, additionalGuards: any[] = []) => ({
    path,
    component,
    canActivate: [SubscriptionGuard, ...additionalGuards]
});

const createCheckoutResolver = () => ({
    resolvedData: () => {
        const authUser = JSON.parse(localStorage.getItem('user')!);
        return inject(StripeService).createCustomerSession(authUser.uid);
    }
});

export const routes: Routes = [
    createAuthRoute('login', LoginComponent, true),
    createAuthRoute('forgot-password', ForgotPasswordComponent, true),
    {path: 'reset-password', component: ResetPasswordComponent},
    {path: 'auth-action', component: AuthActionComponent},

    {
        path: 'signup',
        component: SignupFlowComponent,
        children: [
            createAuthRoute('', SignupComponent, true),
            createAuthRoute('verify-email', VerifyEmailComponent),
            {
                ...createAuthRoute('checkout', CheckoutComponent),
                resolve: createCheckoutResolver()
            },
            createAuthRoute('complete', SignupCompleteComponent)
        ]
    },

    {
        path: '',
        component: DashboardLayoutComponent,
        ...AUTH_GUARD_CONFIG.requireAuth,
        children: [
            createProtectedRoute('home', HomeComponent),
            createProtectedRoute('listings', ListingsComponent),
            createProtectedRoute('sales', SalesComponent),
            createProtectedRoute('sales/:id', SaleDetailComponent),
            {
                ...createProtectedRoute('analytics', AnalyticsComponent, [FeatureAccessGuard]),
                data: {requiredFeature: FEATURE_ROUTES.ANALYTICS}
            },
            createProtectedRoute('sales-upload', SalesUploadComponent),
            {path: 'account', component: AccountComponent},
            {path: 'admin', component: AdminComponent, canActivate: [AdminGuard]}
        ]
    },

    {path: '**', redirectTo: ''}
];
