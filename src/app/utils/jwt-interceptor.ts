import {Injectable} from "@angular/core";
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {AuthService} from "../services/auth.service";
import {from, lastValueFrom, Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {User} from '@angular/fire/auth';

@Injectable()
export class JwtInterceptor implements HttpInterceptor{
  constructor(private authService: AuthService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return from(this.handle(req, next));
  }

  async handle(req: HttpRequest<any>, next: HttpHandler) {
    const isLoggedIn = this.authService.isAuthenticated;
    const isApiUrl = req.url.startsWith(environment.backend.baseURL);
    if (isLoggedIn && isApiUrl) {
      const user: User | null = this.authService.getSignedInUser();
      if (user) {
        const token = await user.getIdToken();
        req = req.clone({
          setHeaders: { Authorization: `Bearer ${token}`}
        })
      }
    }

    return lastValueFrom(next.handle(req));
  }
}
