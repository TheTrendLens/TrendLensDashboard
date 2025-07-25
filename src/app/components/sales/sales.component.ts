import {Component, HostListener, OnInit} from '@angular/core';
import {UserService} from '../../services/user.service';
import {take} from 'rxjs';
import {MatTableModule} from '@angular/material/table';
import {NgForOf, NgIf} from '@angular/common';
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
import {CreateSaleDialogComponent} from '../create-sale-dialog/create-sale-dialog.component';
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
  imports: [MatTableModule, NgForOf, NgIf, FormsModule, MatInputModule, MatPaginatorModule, MatIcon, MatIconButton, SaleCardComponent, MatDateRangeInput, MatDatepickerToggle, MatDateRangePicker, MatEndDate, MatStartDate],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss'
})
export class SalesComponent implements OnInit {
  public salesData: Sale[] = [];
  saleItemCounts: { [bundleId: string]: number } = {};
  searchQuery: string = '';
  totalPages: number = 0;

  // New properties for filtering and sorting
  sortBy: string = 'date_desc';
  dateFilter: string = 'all';
  itemsFilter: string = 'all';
  minProducts: number = 0;
  missingCosts: boolean = false;
  startDate?: Date;
  endDate?: Date;

  Math = Math; // Make Math available to the template

  isLoading: boolean = false;
  totalRows = 7;
  pageSize = 32;
  currentPage = 1;// Default value
  experimentalFeaturesEnabled: boolean = false;

  constructor(
    public userService: UserService,
    public salesService: SalesService,
    public productService: ProductService,
    public dialog: MatDialog,
    private router: Router,
    private featureFlagService: FeatureFlagService,
    private tourService: TourService
  ) {
    // Initialize experimental features state
    this.experimentalFeaturesEnabled = this.featureFlagService.getExperimentalFeaturesEnabled();
    this.featureFlagService.isExperimentalFeaturesEnabled().subscribe(enabled => {
      this.experimentalFeaturesEnabled = enabled;
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
    if (this.currentPage !== 1) {
      this.currentPage = 1;
      this.loadData();
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadData();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadData();
    }
  }

  goToLastPage(): void {
    if (this.currentPage !== this.totalPages) {
      this.currentPage = this.totalPages;
      this.loadData();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadData();
    }
  }

  navigateToBundle(saleId: string): void {
    this.router.navigate(['/sales', saleId]);
  }

  loadData() {
    this.isLoading = true;

    // Convert itemsFilter to minProducts
    if (this.itemsFilter === 'multiple') {
      this.minProducts = 2; // At least 2 products for multiple items
    } else if (this.itemsFilter === 'single') {
      this.minProducts = 1; // Exactly 1 product for single item
    } else {
      this.minProducts = 0; // No minimum for 'all'
    }

    const startDateString = this.startDate ? new Date(this.startDate.setHours(0, 0, 0, 0)).toISOString() : undefined;
    const endDateString = this.endDate ? new Date(this.endDate.setHours(23, 59, 59, 999)).toISOString() : undefined;

    // Pass filters to the service
    this.salesService.getSales(
      this.pageSize,
      this.currentPage,
      this.searchQuery,
      this.dateFilter,
      this.sortBy,
      this.minProducts,
      this.missingCosts,
      startDateString,
      endDateString
    ).pipe(take(1)).subscribe({
      next: (paginatedSales) => {
        this.salesData = paginatedSales.items;
        this.totalRows = paginatedSales.meta.totalItems;
        this.totalPages = paginatedSales.meta.totalPages;
        this.loadSaleItemCounts();

        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
      }
    });
  }

  /**
   * Apply all filters and reload data
   */
  applyFilters() {
    this.currentPage = 1; // Reset to first page when filters change
    if (this.startDate && this.endDate) {
      this.dateFilter = 'custom';
    } else if (!this.startDate && !this.endDate) {
      this.dateFilter = 'all';
    }
    this.loadData();
  }

  loadSaleItemCounts(): void {
    this.salesData.forEach(sale => {
      this.productService.getProductsBySale(sale.id).subscribe({
        next: (products: Product[]) => {
          this.saleItemCounts[sale.id] = products.length;
        },
        error: (error) => {
          console.error(`Error fetching sales for bundle ${sale.id}:`, error);
          this.saleItemCounts[sale.id] = 0;
        }
      });
    });
  }

  onSearch(query: string) {
    this.searchQuery = query;
    this.currentPage = 1; // Reset to first page when search changes
    this.loadData(); // This will update totalRows from the pagination response
  }

  /**
   * Listen for window resize events to update product display
   */
  @HostListener('window:resize')
  onResize() {
    // Force change detection to update the product display
    // This is needed because the product limits depend on screen size
    // and we need to re-evaluate them when the screen size changes
    this.salesData = [...this.salesData];
  }

  /**
   * Opens a dialog to create a new sale
   */
  createSale(): void {
    const dialogRef = this.dialog.open(CreateSaleDialogComponent, {
      width: '600px'
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
