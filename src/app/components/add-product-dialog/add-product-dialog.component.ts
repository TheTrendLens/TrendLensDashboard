import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {MatRadioButton, MatRadioGroup} from '@angular/material/radio';
import {MatSelectModule} from '@angular/material/select';
import {NgForOf, NgIf} from '@angular/common';
import {UserService} from '../../services/user.service';
import {Listing} from '../../models/listing';
import {AddListingDialogComponent} from '../add-listing-dialog/add-listing-dialog.component';
import {take} from 'rxjs';
import {ListingService} from '../../services/listing.service';

@Component({
  selector: 'app-add-product-dialog',
  imports: [
    MatInput,
    FormsModule,
    MatFormField,
    ReactiveFormsModule,
    MatDialogContent,
    MatDialogTitle,
    MatLabel,
    MatDialogActions,
    MatButton,
    MatRadioGroup,
    MatRadioButton,
    MatSelectModule,
    NgIf,
    NgForOf
  ],
  templateUrl: './add-product-dialog.component.html',
  styleUrl: './add-product-dialog.component.css'
})
export class AddProductDialogComponent implements OnInit {
  productForm: FormGroup;
  listings: Listing[] = [];
  selectedOption: 'existing' | 'new' = 'existing';
  isLoading = false;
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<AddProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { saleId: string },
    private userService: UserService,
    private dialog: MatDialog,
    private listingService: ListingService
  ) {
    this.productForm = formBuilder.group({
      listing: ['', Validators.required],
      size: ['', Validators.required],
      item_cost: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadListings();
  }

  loadListings(): void {
    this.isLoading = true;
    this.userService.getListings(this.pageSize, this.currentPage).pipe(take(1)).subscribe({
      next: (listings) => {
        this.listings = listings;
        this.isLoading = false;
        this.userService.getListingsCount().pipe(take(1)).subscribe({
          next: (count) => {
            this.totalPages = Math.ceil(count / this.pageSize);
          }
        });
      },
      error: (error) => {
        console.error('Error loading listings:', error);
        this.isLoading = false;
      }
    });
  }

  onOptionChange(option: 'existing' | 'new'): void {
    this.selectedOption = option;
    if (option === 'existing') {
      this.productForm.get('listing')?.enable();
    } else {
      this.productForm.get('listing')?.disable();
    }
  }

  openAddListingDialog(): void {
    const dialogRef = this.dialog.open(AddListingDialogComponent, {
      width: '600px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Save the listing to the backend
        this.listingService.create(result).subscribe({
          next: (createdListing) => {
            // Use the newly created listing with the ID from the backend
            this.productForm.patchValue({
              listing: createdListing.id
            });
          },
          error: (error) => {
            console.error('Error creating listing:', error);
          }
        });
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.productForm.valid) {
      const result = {
        saleId: this.data.saleId,
        listingId: this.productForm.value.listing,
        size: this.productForm.value.size,
        itemCost: this.productForm.value.item_cost,
        option: this.selectedOption
      };
      this.dialogRef.close(result);
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadListings();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadListings();
    }
  }
}
