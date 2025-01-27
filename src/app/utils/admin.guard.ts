import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import {AuthService} from "../services/auth.service";
import {UserService} from "../services/user.service";
@Injectable({
  providedIn: 'root',
})
export class AdminGuard {
  constructor(public authService: AuthService, public userService: UserService, public router: Router) {}
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | UrlTree | boolean {
    if (!this.authService.isLoggedIn) {
      this.router.navigate(['sign-in']);
    }
    return true;
  }
}
