import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, map, of, switchMap } from 'rxjs';
import { User as DbUser } from '../models/user';
import { UserService } from '../services/user.service';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private router: Router,
    private userService: UserService,
    private location: Location
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    // Check if user is logged in and has admin permissions
    const dbUser = this.userService.getCurrentUser();

    if (!dbUser) {
      this.router.navigate(['/login']);
      return of(false);
    }

    if (!dbUser.admin) {
      // Go back to the previous page instead of redirecting to home
      this.location.back();
      return of(false);
    }

    return of(true);
  }
}
