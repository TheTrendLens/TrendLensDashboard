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

const redirectUnauthorisedToLogin: AuthPipeGenerator = () => redirectUnauthorizedTo(['login']);
const redirectLoggedInToDashboard: AuthPipeGenerator = () => redirectLoggedInTo(['home']);

const verifyEmailCheck: AuthPipeGenerator = (next, state) => switchMap((user) => {
  return of(user).pipe(
    redirectUnauthorizedTo(['login']),
    map((result) => {
      if (result) {
        if (user && user.emailVerified) {
          return true;
        } else {
          return ['/signup/verify-email'];
        }
      } else {
        return result;
      }
    })
  )
});

const ifVerifiedEmailGoToCheckout: AuthPipeGenerator = (next, state) => switchMap((user) => {
  return of(user).pipe(
    redirectUnauthorizedTo(['login']),
    map((result) => {
      if (result) {
        if (user && user.emailVerified) {
          return ['/signup/checkout'];
        } else {
          return true;
        }
      } else {
        return result;
      }
    })
  )
});

const redirectToSignupFlow: AuthPipeGenerator = (next, state) => switchMap((user) => {
  const userService = inject(UserService);

  return of(user).pipe(
    redirectUnauthorizedTo(['login']),
    map((result) => {
      if (result) {
        if (user) {
          // We have a logged in user, go through the signup flow checks to see where they need to be redirected to
          const dbUser = userService.getCurrentUser();

          if (dbUser) {
            // Checkout Check
            if (dbUser.active_package != null || !dbUser.new_sub) {
              return true;
            }
          }

          // Verify Email Check
          if (user.emailVerified) {
            return ['/signup/checkout'];
          } else {
            return ['/signup/verify-email'];
          }
        } else {
          return ['/login'];
        }
      } else {
        return result;
      }
    })
  )
});

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


export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [AuthGuard], data: { authGuardPipe: redirectLoggedInToDashboard }},
  { path: 'forgot-password',  component: ForgotPasswordComponent,  canActivate: [AuthGuard], data: { authGuardPipe: redirectLoggedInToDashboard }},
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'auth-action', component: AuthActionComponent },
  { path: 'signup', component: SignupFlowComponent, children: [
      {
        path: '',
        component: SignupComponent,
        canActivate: [AuthGuard], data: { authGuardPipe: redirectLoggedInToDashboard }
      },
      {
        path: 'verify-email',
        component: VerifyEmailComponent,
        canActivate: [AuthGuard], data: { authGuardPipe: authGuardPipe }
      },
      {
        path: 'checkout',
        component: CheckoutComponent,
        canActivate: [AuthGuard], data: { authGuardPipe: authGuardPipe },
        resolve: {
          resolvedData: () => {
            const authUser = JSON.parse(localStorage.getItem('user')!);
            return inject(StripeService).createCustomerSession(authUser.uid);
          },
        }
      },
      {
        path: 'complete',
        component: SignupCompleteComponent,
        canActivate: [AuthGuard], data: { authGuardPipe: authGuardPipe }
      }
    ] },
  { path: '', component: DashboardLayoutComponent, canActivate: [AuthGuard], data: { authGuardPipe: authGuardPipe }, children: [
      {
        path: 'home',
        component: HomeComponent,
        canActivate: [SubscriptionGuard]
      },
      {
        path: 'listings',
        component: ListingsComponent,
        canActivate: [SubscriptionGuard]
      },
      {
        path: 'sales',
        component: SalesComponent,
        canActivate: [SubscriptionGuard]
      },
      {
        path: 'sales/:id',
        component: SaleDetailComponent,
        canActivate: [SubscriptionGuard]
      },
      {
        path: 'analytics',
        component: AnalyticsComponent,
        canActivate: [SubscriptionGuard]
      },
      {
        path: 'account',
        component: AccountComponent
      },
      {
        path: 'admin',
        component: AdminComponent,
        canActivate: [AdminGuard]
      }
    ] },
  { path: '**', redirectTo: '', },
];
