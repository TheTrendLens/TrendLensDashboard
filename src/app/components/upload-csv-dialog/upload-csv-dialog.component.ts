import {Component, ElementRef, HostListener, Inject, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatButton, MatIconButton} from '@angular/material/button';
import {SalesService} from '../../services/sales.service';
import {finalize} from 'rxjs';
import {NgClass, NgIf} from '@angular/common';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-upload-csv-dialog',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogContent,
    MatDialogTitle,
    MatDialogActions,
    MatButton,
    NgIf,
    NgClass
  ],
  templateUrl: './upload-csv-dialog.component.html',
  styleUrl: './upload-csv-dialog.component.css'
})
export class UploadCsvDialogComponent {
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  selectedFileName: string | null = null;
  uploadInProgress = false;
  isDragging = false;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private formBuilder: FormBuilder,
    private salesService: SalesService,
    public dialogRef: MatDialogRef<UploadCsvDialogComponent>,
    private snackBar: MatSnackBar
  ) {
    this.uploadForm = this.formBuilder.group({});
  }

  // Drag and drop functionality
  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (this.isValidCSVFile(file)) {
        this.selectedFile = file;
        this.selectedFileName = file.name;
      } else {
        this.showError('Please select a valid CSV file');
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (this.isValidCSVFile(file)) {
        this.selectedFile = file;
        this.selectedFileName = this.selectedFile.name;
      } else {
        this.showError('Please select a valid CSV file');
        input.value = '';
        this.selectedFile = null;
        this.selectedFileName = null;
      }
    } else {
      this.selectedFile = null;
      this.selectedFileName = null;
    }
  }

  isValidCSVFile(file: File): boolean {
    return file.name.endsWith('.csv') || file.type === 'text/csv';
  }

  showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onUpload(): void {
    if (!this.selectedFile) {
      return;
    }

    this.uploadInProgress = true;

    this.salesService.uploadCSVSales(this.selectedFile, JSON.parse(localStorage.getItem('user')!).uid)
      .pipe(
        finalize(() => this.uploadInProgress = false)
      )
      .subscribe({
        next: (response) => {
          this.snackBar.open('CSV file uploaded successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close({ success: true, data: response });
        },
        error: (error) => {
          console.error('Upload failed:', error);
          this.showError('Upload failed: ' + (error.message || 'Unknown error'));
        }
      });
  }

}
