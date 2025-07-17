import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class TourService {
  private readonly TOUR_COMPLETION_KEY = 'tour_completion';
  private shepherd: any;

  constructor(private router: Router) {
    // Tour service is disabled
    // No initialization of Shepherd.js
    // No event subscription for route changes
  }

  private async initShepherd() {
    try {
      // Dynamically import Shepherd.js
      const Shepherd = await import('shepherd.js');
      this.shepherd = new Shepherd.default.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          cancelIcon: {
            enabled: true
          },
          classes: 'shepherd-theme-default',
          scrollTo: true
        }
      });
    } catch (error) {
      console.error('Failed to load Shepherd.js', error);
    }
  }

  private checkAndStartTour(url: string) {
    // Tour service is disabled
    return;
  }

  // Check if the user has completed the tour for a specific page
  private hasTourBeenCompleted(page: string): boolean {
    const completionData = localStorage.getItem(this.TOUR_COMPLETION_KEY);
    if (!completionData) {
      return false;
    }

    const completedTours = JSON.parse(completionData);
    return completedTours[page] === true;
  }

  // Mark a tour as completed
  private markTourAsCompleted(page: string): void {
    const completionData = localStorage.getItem(this.TOUR_COMPLETION_KEY);
    const completedTours = completionData ? JSON.parse(completionData) : {};

    completedTours[page] = true;
    localStorage.setItem(this.TOUR_COMPLETION_KEY, JSON.stringify(completedTours));
  }

  // Reset all tour completion statuses (for testing)
  public resetTourCompletionStatus(): void {
    localStorage.removeItem(this.TOUR_COMPLETION_KEY);
  }

  // Start the analytics page tour
  public startAnalyticsTour(): void {
    // Tour service is disabled
    return;
  }

  // Start the sales page tour
  public startSalesTour(): void {
    // Tour service is disabled
    return;
  }

  // Start the listings page tour
  public startListingsTour(): void {
    // Tour service is disabled
    return;
  }

  // Start the home page tour
  public startHomeTour(): void {
    // Tour service is disabled
    return;
  }
}
