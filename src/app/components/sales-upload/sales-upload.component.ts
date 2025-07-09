import {Component, OnInit} from '@angular/core';
import {SalesService} from '../../services/sales.service';
import {ImportService} from '../../services/import.service';
import {UserService} from '../../services/user.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {DatePipe, NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-sales-upload',
  templateUrl: './sales-upload.component.html',
  imports: [
    NgForOf,
    DatePipe,
    NgIf
  ],
  styleUrl: './sales-upload.component.css'
})
export class SalesUploadComponent implements OnInit {

  imports: any[] = [];
  isUploading = false;
  selectedFile: File | null = null;
  uploadProgress = 0;

  constructor(private salesService: SalesService,
              private importService: ImportService,
              private userService: UserService,
              private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.loadImports();
  }

  loadImports(): void {
    this.importService.getImports().subscribe({
      next: (imports) => {
        this.imports = imports;
      },
      error: (error) => {
        console.error('Error loading imports:', error);
        this.snackBar.open('Error loading imports: ' + (error.message || 'Unknown error'), 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onFileSelected(event: Event): void {
    this.selectedFile = (event.target as HTMLInputElement).files![0];
  }

  uploadFile(): void {
    if (!this.selectedFile) {
      this.snackBar.open('Please select a file to upload', 'Close', {duration: 5000});
      return;
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    const userId = this.userService.getCurrentUser()?.id;

    this.salesService.uploadCSVSales(this.selectedFile, userId!).subscribe({
      next: (response) => {
        this.isUploading = false;
        this.uploadProgress = 100;
        this.selectedFile = null;
        this.snackBar.open('File uploaded successfully!', 'Close', {duration: 3000, panelClass: ['success-snackbar']});
        this.loadImports();
      },
      error: (error) => {
        this.isUploading = false;
        console.error('Error uploading file:', error);
        this.snackBar.open('Error uploading file: ' + (error.message || 'Unknown error'), 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
        this.selectedFile = null;
      }
    })
  }

  deleteImport(id: string): void {
    if (confirm('Are you sure you want to delete this import?')) {
      this.importService.deleteImport(id).subscribe({
        next: () => {
          this.snackBar.open('Import deleted successfully!', 'Close', {duration: 3000, panelClass: ['success-snackbar']});
          this.loadImports();
        },
        error: (error) => {
          console.error('Error deleting import:', error);
          this.snackBar.open('Error deleting import: ' + (error.message || 'Unknown error'), 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          })
        }
      })
    }
  }

}
