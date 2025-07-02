import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { filter } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { UploadCsvDialogComponent } from '../upload-csv-dialog/upload-csv-dialog.component';
import { User as DbUser } from '../../models/user';

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
  isAdmin = false;

  constructor(
    public authService: AuthService,
    private router: Router,
    private dialog: MatDialog
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
  }

  private checkAdminStatus() {
    try {
      const dbUser: DbUser = JSON.parse(localStorage.getItem('dbUser')!);
      this.isAdmin = dbUser && dbUser.admin === true;
    } catch (error) {
      console.error('Error checking admin status:', error);
      this.isAdmin = false;
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

  openUploadSalesDialog() {
    const dialogRef = this.dialog.open(UploadCsvDialogComponent, {
      width: '90%',
      maxWidth: '600px',
      panelClass: 'responsive-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        // Optionally refresh data or show a success message
        console.log('Upload successful:', result.data);
      }
    });
  }
}
