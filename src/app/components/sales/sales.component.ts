import {Component, inject, OnInit, signal, ChangeDetectionStrategy} from '@angular/core';
import {UserService} from '../../services/user.service';
import {take} from 'rxjs';
import {MatTableModule} from '@angular/material/table';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatDialog} from '@angular/material/dialog';
import {MatIconButton} from '@angular/material/button';
import {Sale} from '../../models/sale';
import {Router} from '@angular/router';
import {MatIcon} from '@angular/material/icon';
import {SalesService} from '../../services/sales.service';
import {ProductService} from '../../services/product.service';
import {Product} from '../../models/product';
import {SaleCardComponent} from '../sale-card/sale-card.component';
import {CreateSaleFlowDialogComponent} from '../create-sale-flow-dialog/create-sale-flow-dialog.component';
import {FeatureFlagService} from '../../services/feature-flag.service';
import {TourService} from '../../services/tour.service';
import {
  MatDatepickerToggle,
  MatDateRangeInput,
  MatDateRangePicker,
  MatEndDate,
  MatStartDate
} from '@angular/material/datepicker';

@Component({
  selector: 'app-sales',
  imports: [
    MatTableModule,
    CommonModule,
    FormsModule,
    MatInputModule,
    MatPaginatorModule,
    MatIcon,
    MatIconButton,
    SaleCardComponent,
    MatDateRangeInput,
    MatDatepickerToggle,
    MatDateRangePicker,
    MatEndDate,
    MatStartDate
  ],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
  host: {
    '(window:resize)': 'onResize()'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SalesComponent implements OnInit {
  public userService = inject(UserService);
  public salesService = inject(SalesService);
  public productService = inject(ProductService);
  public dialog = inject(MatDialog);
  private router = inject(Router);
  private featureFlagService = inject(FeatureFlagService);
  private tourService = inject(TourService);

  salesData = signal<Sale[]>([]);
  saleItemCounts = signal<{ [bundleId: string]: number }>({});
  searchQuery = signal<string>('');
  totalPages = signal<number>(0);

  // New properties for filtering and sorting
  sortBy = signal<string>('date_desc');
  dateFilter = signal<string>('all');
  itemsFilter = signal<string>('all');
  minProducts = signal<number>(0);
  missingCosts = signal<boolean>(false);
  startDate = signal<Date | undefined>(undefined);
  endDate = signal<Date | undefined>(undefined);

  Math = Math; // Make Math available to the template

  isLoading = signal<boolean>(false);
  totalRows = signal<number>(0);
  pageSize = signal<number>(32);
  currentPage = signal<number>(1);
  experimentalFeaturesEnabled = signal<boolean>(false);

  constructor() {
    // Initialize experimental features state
    this.experimentalFeaturesEnabled.set(this.featureFlagService.getExperimentalFeaturesEnabled());
    this.featureFlagService.isExperimentalFeaturesEnabled().subscribe(enabled => {
      this.experimentalFeaturesEnabled.set(enabled);
    });
  }

  // Method to manually start the tour
  startTour(): void {
    this.tourService.startSalesTour();
  }

  ngOnInit(): void {
    this.loadData(); // This will update totalRows from the pagination response
  }

  // Navigation methods
  goToFirstPage(): void {
    if (this.currentPage() !== 1) {
      this.currentPage.set(1);
      this.loadData();
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadData();
    }
  }

  goToNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadData();
    }
  }

  goToLastPage(): void {
    if (this.currentPage() !== this.totalPages()) {
      this.currentPage.set(this.totalPages());
      this.loadData();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.currentPage.set(page);
      this.loadData();
    }
  }

  navigateToBundle(saleId: string): void {
    this.router.navigate(['/sales', saleId]);
  }

  loadData() {
    this.isLoading.set(true);

    // Convert itemsFilter to minProducts
    if (this.itemsFilter() === 'multiple') {
      this.minProducts.set(2); // At least 2 products for multiple items
    } else if (this.itemsFilter() === 'single') {
      this.minProducts.set(1); // Exactly 1 product for single item
    } else {
      this.minProducts.set(0); // No minimum for 'all'
    }

    const startDateValue = this.startDate();
    const endDateValue = this.endDate();
    const startDateString = startDateValue ? new Date(new Date(startDateValue).setHours(0, 0, 0, 0)).toISOString() : undefined;
    const endDateString = endDateValue ? new Date(new Date(endDateValue).setHours(23, 59, 59, 999)).toISOString() : undefined;

    // Pass filters to the service
    this.salesService.getSales(
      this.pageSize(),
      this.currentPage(),
      this.searchQuery(),
      this.dateFilter(),
      this.sortBy(),
      this.minProducts(),
      this.missingCosts(),
      startDateString,
      endDateString
    ).pipe(take(1)).subscribe({
      next: (paginatedSales) => {
        this.salesData.set(paginatedSales.items);
        this.totalRows.set(paginatedSales.meta.totalItems);
        this.totalPages.set(paginatedSales.meta.totalPages);
        this.loadSaleItemCounts();

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error(error);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Apply all filters and reload data
   */
  applyFilters() {
    this.currentPage.set(1); // Reset to first page when filters change
    if (this.startDate() && this.endDate()) {
      this.dateFilter.set('custom');
    } else if (!this.startDate() && !this.endDate()) {
      this.dateFilter.set('all');
    }
    this.loadData();
  }

  loadSaleItemCounts(): void {
    this.salesData().forEach(sale => {
      this.productService.getProductsBySale(sale.id).subscribe({
        next: (products: Product[]) => {
          this.saleItemCounts.update(counts => ({...counts, [sale.id]: products.length}));
        },
        error: (error) => {
          console.error(`Error fetching sales for bundle ${sale.id}:`, error);
          this.saleItemCounts.update(counts => ({...counts, [sale.id]: 0}));
        }
      });
    });
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset to first page when search changes
    this.loadData(); // This will update totalRows from the pagination response
  }

  /**
   * Listen for window resize events to update product display
   */
  onResize() {
    // Force change detection logic if needed
  }

  /**
   * Opens a dialog to create a new sale using the multi-stage flow
   */
  createSale(): void {
    const dialogRef = this.dialog.open(CreateSaleFlowDialogComponent, {
      width: '900px', // Larger width for the multi-stage flow
      maxWidth: '95vw',
      panelClass: 'create-sale-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.salesService.create(result).subscribe({
          next: (newSale) => {
            // Navigate to the new sale detail page
            this.router.navigate(['/sales', newSale.id]);
          },
          error: (error) => {
            console.error('Error creating sale:', error);
          }
        });
      }
    });
  }
}
