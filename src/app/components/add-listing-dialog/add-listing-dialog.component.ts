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
  isEdit: boolean = false;
  listingId: string | undefined;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AddListingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService
  ) {
    // Initialize form
    this.listingForm = formBuilder.group({
      slug: [{ value: '', disabled: data?.isManual ? false : true }, [Validators.required]],
      date_listed: [{ value: new Date(), disabled: data?.isManual ? false : true }, Validators.required],
      brand: [{ value: '', disabled: data?.isManual ? false : true }],
      category: [{ value: '', disabled: data?.isManual ? false : true }, Validators.required],
      listed_price: [{ value: 0, disabled: data?.isManual ? false : true }, [Validators.required, Validators.min(0)]],
      item_cost: [0, [Validators.min(0)]],
      quantity: [1, [Validators.required, Validators.min(0)]],
      description: [{ value: '', disabled: data?.isManual ? false : true }, Validators.required],
    });

    // Check if we're in edit mode
    if (data && data.isEdit !== undefined) {
      this.isEdit = data.isEdit;
    }

    // If data contains a listing, populate the form and store the ID if in edit mode
    if (data && data.listing) {
      // Ensure date_listed is a Date object
      const listing = { ...data.listing };
      if (listing.date_listed && !(listing.date_listed instanceof Date)) {
        listing.date_listed = new Date(listing.date_listed);
      }

      this.listingForm.patchValue(listing);

      if (this.isEdit && data.listing.id) {
        this.listingId = data.listing.id;
      }
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
        console.error('No user found. Cannot create/update listing.');
        return;
      }

      const listing: Listing = {
        ...this.listingForm.value,
        userId: this.currentUser.id // Add the user ID
      }

      // If we're in edit mode, preserve the ID
      if (this.isEdit && this.listingId) {
        listing.id = this.listingId;
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
