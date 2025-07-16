import {Injectable} from '@angular/core';
import {FeatureAccessService} from '../services/feature-access.service';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {catchError, map, Observable, of, tap} from 'rxjs';
import {Location} from '@angular/common';

@Injectable({ providedIn: 'root'})
export class FeatureAccessGuard {
  constructor(
    private featureAccessService: FeatureAccessService,
    private router: Router,
    private location: Location
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    const requiredFeature = route.data['requiredFeature'];

    if (!requiredFeature) {
      console.warn('No required feature specified for route:', route);
      return of(true);
    }

    return this.featureAccessService.hasAccess(requiredFeature).pipe(
      tap(hasAccess => {
        if (!hasAccess) {
          console.log(`Access denied to feature: ${requiredFeature}`);
        }
      }),
      map(hasAccess => {
        if (hasAccess) {
          return true;
        } else {
          // Go back to the previous page instead of redirecting to upgrade
          this.location.back();
          return false;
        }
      }),
      catchError(() => {
        // Go back to the previous page on error
        this.location.back();
        return of(false);
      })
    );
  }
}
