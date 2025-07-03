import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserService } from './user.service';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class FeatureFlagService {
  private experimentalFeaturesEnabled = new BehaviorSubject<boolean>(false);

  constructor(private userService: UserService) {
    // Initialize from localStorage if available
    const dbUserStr = localStorage.getItem('dbUser');
    if (dbUserStr) {
      try {
        const dbUser = JSON.parse(dbUserStr);
        if (dbUser && dbUser.experimental_features !== undefined) {
          this.experimentalFeaturesEnabled.next(dbUser.experimental_features);
        }
      } catch (e) {
        console.error('Error parsing dbUser from localStorage', e);
      }
    }

    // Fetch the latest value from the server
    this.userService.get().pipe(take(1)).subscribe({
      next: (user) => {
        if (user && user.experimental_features !== undefined) {
          this.experimentalFeaturesEnabled.next(user.experimental_features);
        }
      },
      error: (error) => {
        console.error('Error fetching user:', error);
      }
    });
  }

  /**
   * Get the current state of experimental features
   */
  isExperimentalFeaturesEnabled(): Observable<boolean> {
    return this.experimentalFeaturesEnabled.asObservable();
  }

  /**
   * Get the current value of experimental features
   */
  getExperimentalFeaturesEnabled(): boolean {
    return this.experimentalFeaturesEnabled.value;
  }

  /**
   * Update the experimental features flag
   */
  setExperimentalFeaturesEnabled(enabled: boolean): void {
    this.experimentalFeaturesEnabled.next(enabled);

    // Update on the server
    this.userService.updateExperimentalFeatures(enabled).pipe(take(1)).subscribe({
      next: () => {
        console.log('Experimental features updated successfully');

        // Update in localStorage
        const dbUserStr = localStorage.getItem('dbUser');
        if (dbUserStr) {
          try {
            const dbUser = JSON.parse(dbUserStr);
            dbUser.experimental_features = enabled;
            localStorage.setItem('dbUser', JSON.stringify(dbUser));
          } catch (e) {
            console.error('Error updating dbUser in localStorage', e);
          }
        }
      },
      error: (error) => {
        console.error('Error updating experimental features:', error);
        // Revert the local value if the server update fails
        this.experimentalFeaturesEnabled.next(!enabled);
      }
    });
  }
}
