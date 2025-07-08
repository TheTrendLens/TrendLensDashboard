import {environment} from '../../environments/environment';
import {Injectable} from '@angular/core';
import {BehaviorSubject, catchError, map, Observable, of, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {UserService} from './user.service';

@Injectable({ providedIn: 'root'})
export class FeatureAccessService {
  private endpoint = `${environment.backend.baseURL}/api/feature-access`;
  private userFeatureSubject = new BehaviorSubject<string[]>([]);
  public userFeatures$ = this.userFeatureSubject.asObservable();

  private featureAccessCache: Record<string, boolean> = {};
  private cacheExpiration = 5 * 60 * 1000;
  private lastCacheUpdate = 0;

  constructor(private http: HttpClient, private userService: UserService) {
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.loadUserFeatures();
      } else {
        this.userFeatureSubject.next([]);
        this.featureAccessCache = {};
      }
    });
  }

  loadUserFeatures(): Observable<string[]> {
    return this.http.get<{ features: string[] }>(`${this.endpoint}/user-features`).pipe(
      map(response => response.features),
      tap(features => {
        this.userFeatureSubject.next(features);

        this.lastCacheUpdate = Date.now();
        this.featureAccessCache = {};
        features.forEach(feature => this.featureAccessCache[feature] = true);
      }),
      catchError(error => {
        console.error('Error loading user features:', error);
        return of([]);
      })
    );
  }

  hasAccess(featureId: string): Observable<boolean> {
    if (this.lastCacheUpdate > 0 &&
      Date.now() - this.lastCacheUpdate < this.cacheExpiration &&
    this.featureAccessCache[featureId] !== undefined) {
      return of(this.featureAccessCache[featureId]);
    }

    return this.http.get<{ hasAccess: boolean }>(`${this.endpoint}/check/${featureId}`).pipe(
      map(response => response.hasAccess),
      tap(hasAccess => {
        this.featureAccessCache[featureId] = hasAccess;
        this.lastCacheUpdate = Date.now();
      }),
      catchError(error => {
        console.error('Error checking feature access:', error);
        return of(false);
      })
    )
  }

  hasAccessSync(featureId: string): boolean {
    return this.featureAccessCache[featureId];
  }
}
