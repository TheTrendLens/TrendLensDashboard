import {Component, Inject} from '@angular/core';
import {MatFormField, MatInput} from '@angular/material/input';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
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
    MatButton
  ],
  templateUrl: './add-listing-dialog.component.html',
  styleUrl: './add-listing-dialog.component.css'
})
export class AddListingDialogComponent {
  listingForm: FormGroup;

  constructor(private formBuilder: FormBuilder, public dialogRef: MatDialogRef<AddListingDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: Listing) {
    this.listingForm = formBuilder.group({
      name: ['', Validators.required],
      brand: [''],
      category: ['', Validators.required],
      listed_price: ['', Validators.required],
      condition: ['', Validators.required],
      gender: [''],
      is_kids: [false],
      slug: ['', Validators.required],
      sold: [true],
      item_cost: ['']
    })
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.listingForm.valid) {
      const listing: Listing = {
        id: 0,
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
        date_last_gathered: new Date()
      }
      this.dialogRef.close(listing);
    }
  }
}
