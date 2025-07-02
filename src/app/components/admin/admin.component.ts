import { Component, OnInit } from '@angular/core';
import { AdminService, UserAdminInfo } from '../../services/admin.service';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe, NgIf } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    DatePipe,
    NgIf,
    MatDialogModule,
    MatTooltipModule
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  users: UserAdminInfo[] = [];
  displayedColumns: string[] = ['email', 'lastLogin', 'signupDate', 'activePackage', 'databaseUsage', 'actions'];
  loading = true;

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.snackBar.open('Error loading users. Please try again.', 'Close', {
          duration: 5000
        });
        this.loading = false;
      }
    });
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
        this.snackBar.open(response.message, 'Close', {
          duration: 5000
        });
        this.loadUsers(); // Reload the user list
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.snackBar.open('Error deleting user. Please try again.', 'Close', {
          duration: 5000
        });
      }
    });
  }
}
