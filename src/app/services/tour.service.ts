import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TourService {
  private readonly TOUR_COMPLETION_KEY = 'tour_completion';
  private shepherd: any;

  constructor(private router: Router) {
    // Dynamically import Shepherd.js when the service is initialized
    this.initShepherd();

    // Listen for route changes to start tours on specific pages
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;
      this.checkAndStartTour(url);
    });
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
    // Extract the route path
    const path = url.split('?')[0];

    // Check if user has completed the tour for this page
    if (!this.hasTourBeenCompleted(path)) {
      // Start the appropriate tour based on the current route
      if (path === '/analytics') {
        this.startAnalyticsTour();
      } else if (path === '/sales') {
        this.startSalesTour();
      } else if (path === '/listings') {
        this.startListingsTour();
      } else if (path === '/home' || path === '/') {
        this.startHomeTour();
      }
    }
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
    if (!this.shepherd) {
      console.error('Shepherd.js not initialized');
      return;
    }

    this.shepherd.cancel();
    this.shepherd.steps = [];

    this.shepherd.addStep({
      id: 'analytics-welcome',
      title: 'Welcome to Analytics',
      text: 'This page provides insights into your sales performance and trends.',
      attachTo: {
        element: '.mb-6.bg-white.rounded-lg.shadow.p-4',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Skip',
          action: this.shepherd.cancel
        },
        {
          text: 'Next',
          action: this.shepherd.next
        }
      ]
    });

    this.shepherd.addStep({
      id: 'analytics-time-period',
      title: 'Time Period Selection',
      text: 'Select different time periods to analyze your sales data.',
      attachTo: {
        element: '.flex.flex-wrap.gap-2',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Back',
          action: this.shepherd.back
        },
        {
          text: 'Next',
          action: this.shepherd.next
        }
      ]
    });

    this.shepherd.addStep({
      id: 'analytics-filters',
      title: 'Advanced Filters',
      text: 'Use these filters to drill down into specific categories or time ranges.',
      attachTo: {
        element: 'button[ng-reflect-ng-class]',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Back',
          action: this.shepherd.back
        },
        {
          text: 'Next',
          action: this.shepherd.next
        }
      ]
    });

    this.shepherd.addStep({
      id: 'analytics-charts',
      title: 'Data Visualization',
      text: 'These charts help you visualize your sales trends and performance metrics.',
      attachTo: {
        element: 'app-sales-over-time-chart',
        on: 'top'
      },
      buttons: [
        {
          text: 'Back',
          action: this.shepherd.back
        },
        {
          text: 'Finish',
          action: () => {
            this.shepherd.complete();
            this.markTourAsCompleted('/analytics');
          }
        }
      ]
    });

    this.shepherd.start();
  }

  // Start the sales page tour
  public startSalesTour(): void {
    if (!this.shepherd) {
      console.error('Shepherd.js not initialized');
      return;
    }

    this.shepherd.cancel();
    this.shepherd.steps = [];

    this.shepherd.addStep({
      id: 'sales-welcome',
      title: 'Welcome to Sales',
      text: 'This page shows all your sales records and allows you to manage them.',
      attachTo: {
        element: 'app-sales',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Skip',
          action: this.shepherd.cancel
        },
        {
          text: 'Next',
          action: this.shepherd.next
        }
      ]
    });

    this.shepherd.addStep({
      id: 'sales-filters',
      title: 'Sales Filters',
      text: 'Filter your sales by date, number of items, or use the search function.',
      attachTo: {
        element: 'input[type="text"]',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Back',
          action: this.shepherd.back
        },
        {
          text: 'Next',
          action: this.shepherd.next
        }
      ]
    });

    this.shepherd.addStep({
      id: 'sales-create',
      title: 'Create New Sales',
      text: 'Click here to record a new sale.',
      attachTo: {
        element: 'button.bg-brand-600',
        on: 'left'
      },
      buttons: [
        {
          text: 'Back',
          action: this.shepherd.back
        },
        {
          text: 'Finish',
          action: () => {
            this.shepherd.complete();
            this.markTourAsCompleted('/sales');
          }
        }
      ]
    });

    this.shepherd.start();
  }

  // Start the listings page tour
  public startListingsTour(): void {
    if (!this.shepherd) {
      console.error('Shepherd.js not initialized');
      return;
    }

    this.shepherd.cancel();
    this.shepherd.steps = [];

    this.shepherd.addStep({
      id: 'listings-welcome',
      title: 'Welcome to Listings',
      text: 'This page shows all your product listings and allows you to manage them.',
      attachTo: {
        element: 'app-listings',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Skip',
          action: this.shepherd.cancel
        },
        {
          text: 'Next',
          action: this.shepherd.next
        }
      ]
    });

    this.shepherd.addStep({
      id: 'listings-search',
      title: 'Search Listings',
      text: 'Search for specific listings by name, SKU, or other attributes.',
      attachTo: {
        element: 'input[type="text"]',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Back',
          action: this.shepherd.back
        },
        {
          text: 'Next',
          action: this.shepherd.next
        }
      ]
    });

    this.shepherd.addStep({
      id: 'listings-create',
      title: 'Create New Listing',
      text: 'Click here to add a new product listing.',
      attachTo: {
        element: 'button.bg-brand-600',
        on: 'left'
      },
      buttons: [
        {
          text: 'Back',
          action: this.shepherd.back
        },
        {
          text: 'Finish',
          action: () => {
            this.shepherd.complete();
            this.markTourAsCompleted('/listings');
          }
        }
      ]
    });

    this.shepherd.start();
  }

  // Start the home page tour
  public startHomeTour(): void {
    if (!this.shepherd) {
      console.error('Shepherd.js not initialized');
      return;
    }

    this.shepherd.cancel();
    this.shepherd.steps = [];

    this.shepherd.addStep({
      id: 'home-welcome',
      title: 'Welcome to TrendLens',
      text: 'This is your dashboard where you can see an overview of your business performance.',
      attachTo: {
        element: 'app-stat-cards',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Skip',
          action: this.shepherd.cancel
        },
        {
          text: 'Next',
          action: this.shepherd.next
        }
      ]
    });

    this.shepherd.addStep({
      id: 'home-stats',
      title: 'Key Metrics',
      text: 'These cards show your key performance metrics at a glance.',
      attachTo: {
        element: 'app-stat-cards',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Back',
          action: this.shepherd.back
        },
        {
          text: 'Next',
          action: this.shepherd.next
        }
      ]
    });

    this.shepherd.addStep({
      id: 'home-actions',
      title: 'Action Required',
      text: 'This section shows items that need your attention.',
      attachTo: {
        element: 'app-action-required-tables',
        on: 'top'
      },
      buttons: [
        {
          text: 'Back',
          action: this.shepherd.back
        },
        {
          text: 'Finish',
          action: () => {
            this.shepherd.complete();
            this.markTourAsCompleted('/home');
            this.markTourAsCompleted('/');
          }
        }
      ]
    });

    this.shepherd.start();
  }
}
