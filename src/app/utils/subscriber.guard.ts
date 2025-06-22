import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {User} from '../models/user';
import {catchError, map, Observable, of} from 'rxjs';
import {Injectable} from '@angular/core';
import {UserService} from '../services/user.service';
import {AuthService} from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class SubscriberGuard {
  constructor(public userService: UserService, public authService: AuthService, public router: Router) {
  }

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | UrlTree | boolean {
    if (this.authService.isAuthenticated) {
      return this.userService.get().pipe(
        map((res) => {
          if (res.active_package) {
            return true;
          } else {
            this.router.navigate(['signup/checkout']);
            return false;
          }
        }),
        catchError((err) => {
          this.router.navigate(['signup/checkout']);
          return of(false);
        })
      )
    } else {
      return of(false);
    }
  }
}
