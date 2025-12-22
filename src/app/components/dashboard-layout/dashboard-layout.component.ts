import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { Subscription } from 'rxjs';
import { FeatureAccessService } from '../../services/feature-access.service';
import { UpgradeDialogComponent } from '../upgrade-dialog/upgrade-dialog.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, UpgradeDialogComponent],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.css'
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  isMobileSidebarOpen = false;
  currentPageTitle = 'Dashboard';
  isAdmin = false;
  hasAnalyticsAccess = false;
  private userSubscription: Subscription | null = null;
  private featureSubscription: Subscription | null = null;

  constructor(
    public authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private userService: UserService,
    private featureAccessService: FeatureAccessService
  ) {}

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updatePageTitle();
    });

    // Set initial page title
    this.updatePageTitle();

    // Check if user is admin
    this.checkAdminStatus();

    // Check if user has access to analytics
    this.checkAnalyticsAccess();
  }

  private checkAnalyticsAccess() {
    // Load initial features
    this.featureAccessService.loadUserFeatures().subscribe();

    // Subscribe to feature changes
    this.featureSubscription = this.featureAccessService.userFeatures$.subscribe(features => {
      this.hasAnalyticsAccess = features.includes('ANALYTICS_BASE');
    });
  }

  private checkAdminStatus() {
    // Check current user first
    const currentUser = this.userService.getCurrentUser();
    if (currentUser) {
      this.isAdmin = currentUser.admin;
    }

    // Subscribe to user changes
    this.userSubscription = this.userService.currentUser$.subscribe(user => {
      this.isAdmin = user?.admin === true;
    });
  }

  ngOnDestroy() {
    // Clean up subscriptions when component is destroyed
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }

    if (this.featureSubscription) {
      this.featureSubscription.unsubscribe();
    }
  }

  private updatePageTitle() {
    const currentRoute = this.router.url;

    if (currentRoute.includes('/home')) {
      this.currentPageTitle = 'Dashboard';
    } else if (currentRoute.includes('/sales')) {
      this.currentPageTitle = 'Sales';
    } else if (currentRoute.includes('/admin')) {
      this.currentPageTitle = 'Admin Dashboard';
    } else if (currentRoute.includes('/analytics')) {
      this.currentPageTitle = 'Analytics';
    } else if (currentRoute.includes('/account')) {
      this.currentPageTitle = 'Account';
    } else {
      // Default title
      this.currentPageTitle = 'Dashboard';
    }
  }

  toggleMobileSidebar() {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
  }

  closeMobileSidebar() {
    this.isMobileSidebarOpen = false;
  }
}
