import {Component, ElementRef, Inject, ViewChild} from '@angular/core';
import {MatFormField, MatInput, MatSuffix} from '@angular/material/input';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatButton, MatIconButton} from '@angular/material/button';
import {Listing} from '../../models/listing';
import {SalesService} from '../../services/sales.service';
import {finalize} from 'rxjs';
import {NgIf} from '@angular/common';
import {MatLabel} from '@angular/material/form-field';
import {MatChip} from '@angular/material/chips';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-upload-csv-dialog',
  imports: [
    MatInput,
    FormsModule,
    MatFormField,
    ReactiveFormsModule,
    MatDialogContent,
    MatDialogTitle,
    MatDialogActions,
    MatButton,
    MatLabel,
    NgIf,
    MatIconButton,
    MatIcon,
    MatSuffix
  ],
  templateUrl: './upload-csv-dialog.component.html',
  styleUrl: './upload-csv-dialog.component.css'
})
export class UploadCsvDialogComponent {
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  selectedFileName: string | null = null;
  uploadInProgress = false;

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private formBuilder: FormBuilder,
    private salesService: SalesService,
    public dialogRef: MatDialogRef<UploadCsvDialogComponent>
  ) {
    this.uploadForm = this.formBuilder.group({});
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.selectedFileName = this.selectedFile.name;
    } else {
      this.selectedFile = null;
      this.selectedFileName = null;
    }
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
          this.dialogRef.close({ success: true, data: response });
        },
        error: (error) => {
          console.error('Upload failed:', error);
          // You could handle errors by showing a snackbar or alert
        }
      });
  }

}
