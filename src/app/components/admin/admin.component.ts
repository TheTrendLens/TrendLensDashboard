import { Component, OnInit } from '@angular/core';
import { AdminService, UserAdminInfo, PaginatedUserAdminInfo, QueuedJob, SystemStats } from '../../services/admin.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { DatePipe, NgIf, NgForOf, JsonPipe, CurrencyPipe, UpperCasePipe, DecimalPipe, NgClass } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatCardModule } from '@angular/material/card';
import { NotificationService } from '../../services/notification.service';
import { CurrencyService } from '../../services/currency.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    DatePipe,
    NgIf,
    NgForOf,
    CurrencyPipe,
    UpperCasePipe,
    DecimalPipe,
    NgClass,
    MatDialogModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatCardModule
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  users: UserAdminInfo[] = [];
  jobs: QueuedJob[] = [];
  healthStatus: any = null;
  stats: SystemStats | null = null;

  displayedColumns: string[] = [
    'email',
    'lastLogin',
    'signupDate',
    'activePackage',
    'databaseUsage',
    'missingCosts',
    'missingCostsThisMonth',
    'sent_report',
    'actions'
  ];

  jobDisplayedColumns: string[] = [
    'id',
    'queue',
    'name',
    'status',
    'timestamp',
    'progress',
    'actions'
  ];

  loading = true;
  jobsLoading = false;

  // Pagination
  totalUsers = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private adminService: AdminService,
    private notificationService: NotificationService,
    public currencyService: CurrencyService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadUsers();
    this.loadJobs();
    this.loadHealth();
    this.loadStats();
  }

  loadStats(): void {
    this.adminService.getSystemStats().subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (error) => {
        console.error('Error loading system stats:', error);
      }
    });
  }

  loadUserDetail(userId: string): void {
    // For now, we'll just find the user in the existing list if they are there,
    // or we could navigate to a detailed view if we had one.
    // As a simple enhancement, we'll just log it and maybe show a toast.
    this.notificationService.info(`Viewing details for user ${userId}`);
    // Future enhancement: navigate to user detail page or open a dialog
  }

  loadUsers(page: number = 1, limit: number = this.pageSize): void {
    this.loading = true;
    this.adminService.getAllUsers(page, limit).subscribe({
      next: (response) => {
        this.users = response.users;
        this.totalUsers = response.total;
        this.pageSize = response.limit;
        this.pageIndex = response.page - 1; // Angular Material uses 0-based indexing
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.notificationService.error('Error loading users. Please try again.');
        this.loading = false;
      }
    });
  }

  loadJobs(): void {
    this.jobsLoading = true;
    this.adminService.getQueuedJobs().subscribe({
      next: (jobs) => {
        this.jobs = jobs;
        this.jobsLoading = false;
      },
      error: (error) => {
        console.error('Error loading jobs:', error);
        this.notificationService.error('Error loading queued jobs.');
        this.jobsLoading = false;
      }
    });
  }

  loadHealth(): void {
    this.adminService.getHealth().subscribe({
      next: (status) => {
        this.healthStatus = status;
      },
      error: (error) => {
        console.error('Error loading health status:', error);
      }
    });
  }

  retryJob(job: QueuedJob): void {
    this.adminService.retryJob(job.queue, job.id).subscribe({
      next: (response) => {
        this.notificationService.success(response.message);
        this.loadJobs();
      },
      error: (error) => {
        console.error('Error retrying job:', error);
        this.notificationService.error('Failed to retry job.');
      }
    });
  }

  removeJob(job: QueuedJob): void {
    if (confirm(`Are you sure you want to remove job ${job.id} from ${job.queue}?`)) {
      this.adminService.removeJob(job.queue, job.id).subscribe({
        next: (response) => {
          this.notificationService.success(response.message);
          this.loadJobs();
        },
        error: (error) => {
          console.error('Error removing job:', error);
          this.notificationService.error('Failed to remove job.');
        }
      });
    }
  }

  handlePageEvent(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.loadUsers(this.pageIndex + 1, this.pageSize); // +1 because backend uses 1-based indexing
  }

  formatBytes(bytes: number): string {
    return this.adminService.formatBytes(bytes);
  }

  confirmDelete(user: UserAdminInfo): void {
    if (confirm(`Are you sure you want to delete user ${user.email}? This will also delete their Firebase account and cancel their Stripe subscription.`)) {
      this.deleteUser(user);
    }
  }

  deleteUser(user: UserAdminInfo): void {
    this.adminService.deleteUser(user.id).subscribe({
      next: (response) => {
        this.notificationService.success(response.message);
        this.loadUsers(); // Reload the user list
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.notificationService.error('Error deleting user. Please try again.');
      }
    });
  }

  isValidDate(date: any): boolean {
    return date instanceof Date;
  }

  /**
   * Trigger file input click
   * @param userId The user ID
   */
  triggerFileInput(userId: string): void {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/pdf';
    fileInput.style.display = 'none';

    // Add event listener for file selection
    fileInput.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        this.uploadPdfReport(userId, target.files[0]);
      }
    });

    // Trigger click on the file input
    document.body.appendChild(fileInput);
    fileInput.click();

    // Remove the file input after selection
    fileInput.addEventListener('blur', () => {
      document.body.removeChild(fileInput);
    });
  }

  /**
   * Upload PDF report and send it to the user
   * @param userId The user ID
   * @param file The PDF file
   */
  uploadPdfReport(userId: string, file: File): void {
    if (!file.type.includes('pdf')) {
      this.notificationService.error('Only PDF files are allowed.');
      return;
    }

    this.adminService.sendReportToUser(userId, file).subscribe({
      next: (response) => {
        this.notificationService.success(response.message);
        this.loadUsers(); // Reload the user list to update the sent_report status
      },
      error: (error) => {
        console.error('Error uploading PDF report:', error);
        this.notificationService.error(error.error?.message || 'Error uploading PDF report. Please try again.');
      }
    });
  }
}
