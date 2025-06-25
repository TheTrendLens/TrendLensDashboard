import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './dashboard-layout.component.html',
  styleUrl: './dashboard-layout.component.css'
})
export class DashboardLayoutComponent implements OnInit {
  isMobileSidebarOpen = false;
  currentPageTitle = 'Dashboard';

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updatePageTitle();
    });

    // Set initial page title
    this.updatePageTitle();
  }

  private updatePageTitle() {
    const currentRoute = this.router.url;

    if (currentRoute.includes('/home')) {
      this.currentPageTitle = 'Dashboard';
    } else if (currentRoute.includes('/sales')) {
      this.currentPageTitle = 'Sales';
    } else {
      // Add more route mappings as needed
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
