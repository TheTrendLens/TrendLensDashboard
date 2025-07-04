import {Component, Inject, OnInit} from '@angular/core';
import {MatFormField, MatHint, MatInput} from '@angular/material/input';
import {AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatButton} from '@angular/material/button';
import {MatDatepicker, MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {Listing} from '../../models/listing';
import {MatError} from '@angular/material/form-field';
import {NgIf} from '@angular/common';
import {UserService} from '../../services/user.service';
import {User} from '../../models/user';
import {take} from 'rxjs';


@Component({
  selector: 'app-add-listing-dialog',
  imports: [
    MatInput,
    FormsModule,
    MatFormField,
    ReactiveFormsModule,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    NgIf,
    MatDatepickerModule,
    MatNativeDateModule,
    MatHint
  ],
  templateUrl: './add-listing-dialog.component.html',
  styleUrl: './add-listing-dialog.component.css'
})
export class AddListingDialogComponent implements OnInit {
  listingForm: FormGroup;
  currentUser: User | null = null;
  errorMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AddListingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService
  ) {
    // Initialize form
    this.listingForm = formBuilder.group({
      slug: ['', [Validators.required]],
      date_listed: [new Date(), Validators.required],
      brand: [''],
      category: ['', Validators.required],
      listed_price: [0, [Validators.required, Validators.min(0)]],
      item_cost: [0, [Validators.min(0)]],
      quantity: [1, [Validators.required, Validators.min(0)]],
      description: ['', Validators.required]
    });

    // If data contains a listing, populate the form
    if (data && data.listing) {
      this.listingForm.patchValue(data.listing);
    }

    // If data contains an error message, set it
    if (data && data.errorMessage) {
      this.errorMessage = data.errorMessage;
    }
  }

  ngOnInit(): void {
    this.userService.get().pipe(take(1)).subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (error) => {
        console.error('Error getting current user:', error);
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.listingForm.valid) {
      if (!this.currentUser) {
        console.error('No user found. Cannot create listing.');
        return;
      }

      const listing: Listing = {
        ...this.listingForm.value,
        userId: this.currentUser.id // Add the user ID
      }
      this.dialogRef.close(listing);
    }
  }

  getSlugErrorMessage(): string {
    const slugControl = this.listingForm.get('slug');
    if (slugControl?.hasError('required')) {
      return 'Slug is required';
    }
    return '';
  }
}
