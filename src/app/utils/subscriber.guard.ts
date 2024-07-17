import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree,} from '@angular/router';
import {catchError, map, Observable, of} from 'rxjs';
import {AuthService} from "../services/auth.service";
import {UserService} from "../services/user.service";
import {User} from "../models/user";

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
    let user: User = JSON.parse(localStorage.getItem('dbUser')!)
    if (user) {
      return this.userService.get().pipe(
        map((res) => {
          if (res.active_package) {
            return true;
          } else {
            this.router.navigate(['checkout']);
            return false;
          }
        }),
        catchError((err) => {
          this.router.navigate(['checkout']);
          return of(false);
        })
      )
    } else {
      return of(false);
    }
  }
}
