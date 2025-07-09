import {Component, OnDestroy, OnInit} from '@angular/core';
import {SalesService} from '../../services/sales.service';
import {ImportQueueItem, ImportService} from '../../services/import.service';
import {UserService} from '../../services/user.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {DatePipe, DecimalPipe, NgClass, NgForOf, NgIf, TitleCasePipe} from '@angular/common';
import {interval, Subscription, switchMap} from 'rxjs';
import {takeWhile} from 'rxjs/operators';

@Component({
  selector: 'app-sales-upload',
  templateUrl: './sales-upload.component.html',
  imports: [
    NgForOf,
    NgIf,
    NgClass,
    TitleCasePipe,
    DecimalPipe
  ],
  styleUrl: './sales-upload.component.css'
})
export class SalesUploadComponent implements OnInit, OnDestroy {

  imports: any[] = [];

  queuedImports: ImportQueueItem[] = [];
  activeImports: any[] = [];

  private queueSubscription: Subscription | null = null;
  private activeImportsSubscription: Subscription | null = null;

  selectedFiles: FileList | null = null;

  constructor(private salesService: SalesService,
              private importService: ImportService,
              private userService: UserService,
              private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.loadImports();

    this.queueSubscription = this.importService.importQueue$.subscribe(queue => {
      this.queuedImports = queue;
    });

    this.activeImportsSubscription = this.importService.activeImports$.subscribe(imports => {
      this.activeImports = imports;
    });

    interval(10000).subscribe(() => {
      this.loadImports();
    })
  }

  ngOnDestroy(): void {
    if (this.queueSubscription) {
      this.queueSubscription.unsubscribe();
    }

    if (this.activeImportsSubscription) {
      this.activeImportsSubscription.unsubscribe();
    }
  }

  loadImports(): void {
    this.importService.getImports().subscribe({
      next: (imports) => {
        // Filter out active imports to avoid duplication
        const activeImportIds = this.activeImports.map(imp => imp.id);
        this.imports = imports.filter(imp =>
          !activeImportIds.includes(imp.id) &&
          imp.status !== 'pending' &&
          imp.status !== 'processing'
        );
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
    this.selectedFiles = (event.target as HTMLInputElement).files;
  }

  uploadFiles(): void {
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      this.snackBar.open('Please select files to upload', 'Close', {duration: 5000});
      return;
    }

    // Convert FileList to array
    const files = Array.from(this.selectedFiles);

    // Filter for CSV files only
    const csvFiles = files.filter(file =>
      file.type === 'text/csv' || file.name.endsWith('.csv')
    );

    if (csvFiles.length === 0) {
      this.snackBar.open('Please select CSV files only', 'Close', {duration: 5000});
      return;
    }

    // Add files to queue
    this.importService.addToQueue(csvFiles);

    // Reset file input
    (document.getElementById('fileInput') as HTMLInputElement).value = '';
    this.selectedFiles = null;

    this.snackBar.open(`Added ${csvFiles.length} files to the upload queue`, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  removeFromQueue(index: number): void {
    this.importService.removeFromQueue(index);
  }

  clearQueue(): void {
    if (confirm('Are you sure you want to clear the upload queue?')) {
      this.importService.clearQueue();
    }
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

  getStatusColorClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'processing':
        return 'text-blue-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  }

}
