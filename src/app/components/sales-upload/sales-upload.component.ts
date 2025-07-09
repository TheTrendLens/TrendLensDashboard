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
  deletingImport: any = null;

  private queueSubscription: Subscription | null = null;
  private activeImportsSubscription: Subscription | null = null;
  private deletionStatusSubscription: Subscription | null = null;

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

    if (this.deletionStatusSubscription) {
      this.deletionStatusSubscription.unsubscribe();
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
    // Check if a deletion is already in progress
    this.importService.getDeletionStatus().subscribe({
      next: (status) => {
        if (status.deletionInProgress) {
          this.snackBar.open('A deletion is already in progress. Please wait for it to complete.', 'Close', {
            duration: 5000,
            panelClass: ['warning-snackbar']
          });
          return;
        }

        // If no deletion is in progress, confirm and proceed
        if (confirm('Are you sure you want to delete this import?')) {
          this.importService.initiateAsyncDelete(id).subscribe({
            next: (response) => {
              // Store the deleting import info
              this.deletingImport = {
                id: response.id,
                status: response.status,
                progress: 0,
                filename: this.imports.find(imp => imp.id === id)?.filename || 'Unknown'
              };

              // Add to active imports to show progress
              this.activeImports = [...this.activeImports, this.deletingImport];

              // Start polling for status
              this.pollDeletionStatus(id);

              this.snackBar.open('Deletion initiated. You can track the progress in the Processing section.', 'Close', {
                duration: 5000,
                panelClass: ['success-snackbar']
              });
            },
            error: (error) => {
              console.error('Error initiating deletion:', error);
              this.snackBar.open('Error initiating deletion: ' + (error.message || 'Unknown error'), 'Close', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            }
          });
        }
      },
      error: (error) => {
        console.error('Error checking deletion status:', error);
        this.snackBar.open('Error checking deletion status: ' + (error.message || 'Unknown error'), 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  /**
   * Polls the status of a deleting import
   * @param id The ID of the import being deleted
   */
  private pollDeletionStatus(id: string): void {
    // Clear any existing subscription
    if (this.deletionStatusSubscription) {
      this.deletionStatusSubscription.unsubscribe();
    }

    // Create a new interval subscription
    this.deletionStatusSubscription = interval(1000)
      .pipe(
        switchMap(() => this.importService.getImportStatus(id)),
        takeWhile(status => status.status === 'deleting', true) // Include the last emission
      )
      .subscribe({
        next: (status) => {
          // Update the deleting import status
          if (this.deletingImport && this.deletingImport.id === id) {
            this.deletingImport.progress = status.progress;
            this.deletingImport.status = status.status;

            // Update in active imports array
            const index = this.activeImports.findIndex(imp => imp.id === id);
            if (index !== -1) {
              this.activeImports[index] = {...this.deletingImport};
              this.activeImports = [...this.activeImports]; // Trigger change detection
            }

            // If deletion is complete or failed
            if (status.status === 'deleted' || status.status === 'failed') {
              // Show appropriate message
              if (status.status === 'deleted') {
                this.snackBar.open('Import deleted successfully!', 'Close', {
                  duration: 3000,
                  panelClass: ['success-snackbar']
                });
              } else {
                this.snackBar.open('Deletion failed: ' + (status.error_message || 'Unknown error'), 'Close', {
                  duration: 5000,
                  panelClass: ['error-snackbar']
                });
              }

              // Remove from active imports after a delay
              setTimeout(() => {
                this.activeImports = this.activeImports.filter(imp => imp.id !== id);
                this.deletingImport = null;
                this.loadImports();
              }, 3000);

              // Unsubscribe from polling
              if (this.deletionStatusSubscription) {
                this.deletionStatusSubscription.unsubscribe();
                this.deletionStatusSubscription = null;
              }
            }
          }
        },
        error: (error) => {
          console.error('Error polling deletion status:', error);
          this.snackBar.open('Error tracking deletion: ' + (error.message || 'Unknown error'), 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });

          // Clean up
          this.activeImports = this.activeImports.filter(imp => imp.id !== id);
          this.deletingImport = null;

          // Unsubscribe from polling
          if (this.deletionStatusSubscription) {
            this.deletionStatusSubscription.unsubscribe();
            this.deletionStatusSubscription = null;
          }
        }
      });
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
