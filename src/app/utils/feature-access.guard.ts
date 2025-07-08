import {Injectable} from '@angular/core';
import {FeatureAccessService} from '../services/feature-access.service';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {catchError, map, Observable, of, tap} from 'rxjs';

@Injectable({ providedIn: 'root'})
export class FeatureAccessGuard {
  constructor(private featureAccessService: FeatureAccessService, private router: Router) {}

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
      map(hasAccess => hasAccess ? true : this.router.createUrlTree(['/upgrade'])),
      catchError(() => {
        return of(this.router.createUrlTree(['/upgrade']));
      })
    );
  }
}
