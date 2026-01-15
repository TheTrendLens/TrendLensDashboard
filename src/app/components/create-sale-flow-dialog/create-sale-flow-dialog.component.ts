import {Component, Inject, OnInit, signal, computed, inject, ChangeDetectionStrategy} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatButton, MatIconButton} from '@angular/material/button';
import {MatFormField, MatLabel, MatSuffix, MatPrefix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {Sale} from '../../models/sale';
import {Listing} from '../../models/listing';
import {Product} from '../../models/product';
import {SalesService} from '../../services/sales.service';
import {ListingService} from '../../services/listing.service';
import {UserService} from '../../services/user.service';
import {User} from '../../models/user';
import {take} from 'rxjs';
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {CommonModule, CurrencyPipe, DatePipe} from '@angular/common';
import {AddListingDialogComponent} from '../add-listing-dialog/add-listing-dialog.component';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-create-sale-flow-dialog',
  imports: [
    CommonModule,
    MatInput,
    FormsModule,
    MatFormField,
    ReactiveFormsModule,
    MatDialogContent,
    MatLabel,
    MatDialogActions,
    MatButton,
    MatIconButton,
    MatDatepickerInput,
    MatDatepicker,
    MatNativeDateModule,
    MatDatepickerToggle,
    MatSuffix,
    MatPrefix,
    MatIcon,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './create-sale-flow-dialog.component.html',
  styleUrl: './create-sale-flow-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateSaleFlowDialogComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  public dialogRef = inject(MatDialogRef<CreateSaleFlowDialogComponent>);
  private salesService = inject(SalesService);
  private listingService = inject(ListingService);
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  public data = inject(MAT_DIALOG_DATA);

  step = signal<number>(1);
  saleForm: FormGroup;
  currentUser = signal<User | null>(null);
  isEdit = signal<boolean>(false);
  saleId = signal<string | null>(null);

  // Step 2: Listing Selection
  searchQuery = signal<string>('');
  availableListings = signal<Listing[]>([]);
  selectedListings = signal<{listing: Listing, quantity: number, size: string, id?: string}[]>([]);
  isLoadingListings = signal<boolean>(false);

  constructor() {
    this.saleForm = this.formBuilder.group({
      buyer: ['', Validators.required],
      date_sold: [new Date(), Validators.required],
      payment_type: [''],
      total: [0, [Validators.required, Validators.min(0)]],
      platform_fee: [0, [Validators.required, Validators.min(0)]],
      payment_fee: [0, [Validators.required, Validators.min(0)]],
      seller_postage_cost: [0, [Validators.required, Validators.min(0)]],
      boosting_fee: [0, Validators.min(0)],
      offer: [false]
    });

    if (this.data && this.data.sale) {
      this.isEdit.set(true);
      this.saleId.set(this.data.sale.id);

      const sale = {...this.data.sale};
      if (sale.date_sold && !(sale.date_sold instanceof Date)) {
        sale.date_sold = new Date(sale.date_sold);
      }
      this.saleForm.patchValue(sale);

      if (sale.products) {
        // Group products by listing to populate selectedListings
        const grouped: {[key: string]: {listing: Listing, quantity: number, size: string, id?: string}} = {};
        sale.products.forEach((p: Product) => {
          if (grouped[p.listing.id]) {
            grouped[p.listing.id].quantity++;
          } else {
            grouped[p.listing.id] = {
              listing: p.listing,
              quantity: 1,
              size: p.size || 'One size',
              id: p.id
            };
          }
        });
        this.selectedListings.set(Object.values(grouped));
      }
    }
  }

  ngOnInit(): void {
    this.currentUser.set(this.userService.getCurrentUser());

    this.loadListings();
  }

  loadListings() {
    this.isLoadingListings.set(true);
    this.listingService.getListings(50, 1, this.searchQuery()).subscribe({
      next: (paginated) => {
        this.availableListings.set(paginated.items);
        this.isLoadingListings.set(false);
      },
      error: (err) => {
        console.error(err);
        this.isLoadingListings.set(false);
      }
    });
  }

  onSearchChange() {
    this.loadListings();
  }

  nextStep() {
    if (this.step() === 1 && this.saleForm.valid) {
      this.step.set(2);
    } else if (this.step() === 2) {
      this.step.set(3);
    }
  }

  prevStep() {
    this.step.update(s => s - 1);
  }

  addListing(listing: Listing) {
    const existing = this.selectedListings().find(l => l.listing.id === listing.id);
    if (existing) {
      this.selectedListings.update(list => list.map(item =>
        item.listing.id === listing.id ? {...item, quantity: item.quantity + 1} : item
      ));
    } else {
      this.selectedListings.update(list => [...list, {listing, quantity: 1, size: 'One size'}]);
    }
  }

  removeListing(listingId: string) {
    this.selectedListings.update(list => list.filter(l => l.listing.id !== listingId));
  }

  createNewListing() {
    const dialogRef = this.dialog.open(AddListingDialogComponent, {
      width: '600px',
      data: { isEdit: false }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.listingService.create(result).subscribe({
          next: (newListing) => {
            this.addListing(newListing);
            this.loadListings(); // Refresh list
          },
          error: (err) => console.error(err)
        });
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.saleForm.valid) {
      const user = this.currentUser();
      if (!user) {
        console.error('No user found. Cannot create sale.');
        return;
      }

      const products: Product[] = this.selectedListings().flatMap(item => {
        const itemProducts: Product[] = [];
        for (let i = 0; i < item.quantity; i++) {
          itemProducts.push({
            id: '', // Temporary ID, backend will generate
            listing: item.listing,
            size: item.size,
            item_cost: item.listing.item_cost || 0,
            sale: null as any // Will be linked on the backend
          });
        }
        return itemProducts;
      });

      const sale: Partial<Sale> = {
        ...this.saleForm.value,
        time_sold: this.isEdit() && this.data.sale.time_sold ? this.data.sale.time_sold : new Date().toTimeString().split(' ')[0],
        total_fee: Number(this.saleForm.value.platform_fee) + Number(this.saleForm.value.payment_fee) + Number(this.saleForm.value.boosting_fee),
        products: products,
        user: user
      };

      if (this.isEdit() && this.saleId()) {
        sale.id = this.saleId()!;
      }

      this.dialogRef.close(sale);
    }
  }
}
