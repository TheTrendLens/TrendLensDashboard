import {inject, Injectable} from "@angular/core";
import {StripeService} from "../services/stripe.service";
import {ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot} from "@angular/router";
import {AuthService} from "@auth0/auth0-angular";
import {map, Observable} from "rxjs";

@Injectable({providedIn: 'root'})
class NoSubscriptionGuard {
  constructor(public auth: AuthService, private stripeService: StripeService) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Observable<boolean>> {
    return this.auth.user$.pipe(map((user) => this.stripeService.getSubscriptionStatus(<string>user?.sub).pipe(map((sub) => sub.status !== 'active'))));
  }
}

export const TestGuard: (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => Observable<Observable<boolean>> = (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  return inject(NoSubscriptionGuard).canActivate(next, state);
}
