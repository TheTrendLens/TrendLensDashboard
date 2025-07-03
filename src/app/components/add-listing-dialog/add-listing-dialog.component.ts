import {Component, Inject, OnInit} from '@angular/core';
import {MatFormField, MatInput} from '@angular/material/input';
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
import {Listing} from '../../models/listing';
import {MatError} from '@angular/material/form-field';
import {NgIf} from '@angular/common';
import {UserService} from '../../services/user.service';
import {User} from '../../models/user';
import {take} from 'rxjs';

// Custom validator for slug format (5 words with hyphens)
export function slugFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null; // Let required validator handle empty values
    }

    // Check if the slug has exactly 4 hyphens (which means 5 words)
    const hyphens = (value.match(/-/g) || []).length;
    if (hyphens !== 4) {
      return { slugFormat: true };
    }

    // Check if the slug starts and ends with a word (not a hyphen)
    if (value.startsWith('-') || value.endsWith('-')) {
      return { slugFormat: true };
    }

    // Check if there are no consecutive hyphens
    if (value.includes('--')) {
      return { slugFormat: true };
    }

    return null;
  };
}

@Component({
  selector: 'app-add-listing-dialog',
  imports: [
    MatInput,
    FormsModule,
    MatFormField,
    ReactiveFormsModule,
    MatDialogContent,
    MatDialogTitle,
    MatCheckbox,
    MatDialogActions,
    MatButton,
    MatError,
    NgIf
  ],
  templateUrl: './add-listing-dialog.component.html',
  styleUrl: './add-listing-dialog.component.css'
})
export class AddListingDialogComponent implements OnInit {
  listingForm: FormGroup;
  currentUser: User | null = null;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AddListingDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Listing,
    private userService: UserService
  ) {
    this.listingForm = formBuilder.group({
      name: ['', Validators.required],
      brand: [''],
      category: ['', Validators.required],
      listed_price: ['', Validators.required],
      condition: ['', Validators.required],
      gender: [''],
      is_kids: [false],
      slug: ['', [Validators.required, slugFormatValidator()]],
      sold: [true],
      item_cost: ['']
    })
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
        date_updated: new Date(),
        date_listed: new Date(),
        status: 'active',
        like_count: 0,
        colour: null,
        age: null,
        source: null,
        style: null,
        sub_category: null,
        attributes: {},
        sizes: [],
        date_last_gathered: new Date(),
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
    if (slugControl?.hasError('slugFormat')) {
      return 'Slug must be 5 words separated by hyphens (e.g., word1-word2-word3-word4-word5)';
    }
    return '';
  }
}
