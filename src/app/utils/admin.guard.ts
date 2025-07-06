import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, map, of, switchMap } from 'rxjs';
import { User as DbUser } from '../models/user';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private router: Router, private userService: UserService) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Check if user is logged in and has admin permissions
    const dbUser = this.userService.getCurrentUser();

    if (!dbUser) {
      this.router.navigate(['/login']);
      return of(false);
    }

    if (!dbUser.admin) {
      this.router.navigate(['/home']);
      return of(false);
    }

    return of(true);
  }
}
