import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import {Observable, of, switchMap, map, catchError, from} from 'rxjs';
import { UserService } from '../services/user.service';
import { StripeService } from '../services/stripe.service';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionGuard implements CanActivate {
  // Cache the subscription check result for a short period to avoid redundant API calls
  private lastCheck: { timestamp: number; result: boolean; userId: string } | null = null;
  private readonly CACHE_DURATION = 60000; // 1 minute in milliseconds

  constructor(
    private router: Router,
    private userService: UserService,
    private stripeService: StripeService,
    private authService: AuthService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    // If we're already on the checkout page, allow access to prevent redirect loops
    if (state.url.includes('/signup/checkout')) {
      return of(true);
    }

    // Get the current Firebase auth user
    const firebaseUser = this.authService.getSignedInUser();
    if (!firebaseUser) {
      return of(this.router.createUrlTree(['/login']));
    }

    // Check if we have a cached result that's still valid for the current user
    if (this.lastCheck &&
        (Date.now() - this.lastCheck.timestamp) < this.CACHE_DURATION &&
        this.lastCheck.userId === firebaseUser.uid) {
      return of(this.lastCheck.result ? true : this.router.createUrlTree(['/signup/checkout']));
    }

    // First, ensure we have the latest user data
    return this.ensureLatestUserData().pipe(
      switchMap(() => {
        // Now get the current user from the BehaviorSubject
        const user = this.userService.getCurrentUser();

        // If still no user after fetching, sign out and redirect to login
        if (!user) {
          return from(this.authService.logout()).pipe(
            map(() => this.router.createUrlTree(['/login']))
          );
        }

        // First check if user has active_package in the user object
        if (user.active_package) {
          // Cache the result
          this.lastCheck = { timestamp: Date.now(), result: true, userId: user.id };
          return of(true);
        }

        // If not, make an API call to check the subscription status
        return this.stripeService.getSubscriptionStatus(user.id).pipe(
          map(subscription => {
            const hasActiveSubscription = subscription && subscription.status === 'active'

            // Cache the result
            this.lastCheck = { timestamp: Date.now(), result: hasActiveSubscription, userId: user.id };

            if (hasActiveSubscription) {
              return true;
            } else {
              // Prevent redirect loops by checking if we're already going to checkout
              if (state.url.includes('/signup/checkout')) {
                return true;
              }
              return this.router.createUrlTree(['/signup/checkout']);
            }
          }),
          catchError(error => {
            console.error('Error checking subscription status:', error);
            // On error, we'll be conservative and assume no subscription
            this.lastCheck = { timestamp: Date.now(), result: false, userId: user.id };
            // Prevent redirect loops by checking if we're already going to checkout
            if (state.url.includes('/signup/checkout')) {
              return of(true);
            }
            return of(this.router.createUrlTree(['/signup/checkout']));
          })
        );
      })
    );
  }

  /**
   * Ensures we have the latest user data by fetching it from the backend if needed
   */
  private ensureLatestUserData(): Observable<void> {
    // Check if we already have user data
    const currentUser = this.userService.getCurrentUser();

    if (currentUser) {
      console.log('Using existing user data');
      return of(undefined);
    }

    console.log('Fetching latest user data from backend');
    // If not, fetch it from the backend
    return this.userService.get().pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error fetching user data:', error);
        return of(undefined);
      })
    );
  }
}
