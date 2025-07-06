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
    // Initialize from current user if available
    const currentUser = this.userService.getCurrentUser();
    if (currentUser && currentUser.experimental_features !== undefined) {
      this.experimentalFeaturesEnabled.next(currentUser.experimental_features);
    }

    // Subscribe to user changes to keep experimental features flag in sync
    this.userService.currentUser$.subscribe(user => {
      if (user && user.experimental_features !== undefined) {
        this.experimentalFeaturesEnabled.next(user.experimental_features);
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
    // The UserService.updateExperimentalFeatures method will handle updating the BehaviorSubject and localStorage
    this.userService.updateExperimentalFeatures(enabled).pipe(take(1)).subscribe({
      next: () => {
        console.log('Experimental features updated successfully');
      },
      error: (error) => {
        console.error('Error updating experimental features:', error);
        // Revert the local value if the server update fails
        this.experimentalFeaturesEnabled.next(!enabled);
      }
    });
  }
}
