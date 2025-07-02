import {AfterViewInit, Component, HostListener, OnDestroy, OnInit, ViewChild, ElementRef} from '@angular/core';
import {UserService} from '../../services/user.service';
import {take} from 'rxjs';
import {MatTableModule} from '@angular/material/table';
import {NgForOf, CurrencyPipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatPaginator, MatPaginatorModule} from '@angular/material/paginator';
import {MatDialog} from '@angular/material/dialog';
import {MatIconButton} from '@angular/material/button';
import {Sale} from '../../models/sale';
import {UploadCsvDialogComponent} from '../upload-csv-dialog/upload-csv-dialog.component';
import {EditSaleDialogComponent} from '../edit-sale-dialog/edit-sale-dialog.component';
import {Router} from '@angular/router';
import {MatIcon} from '@angular/material/icon';
import {SalesService} from '../../services/sales.service';
import {ProductService} from '../../services/product.service';
import {Product} from '../../models/product';
import {SaleCardComponent} from '../sale-card/sale-card.component';
import {Pagination} from '../../models/pagination';

@Component({
  selector: 'app-sales',
  imports: [MatTableModule, NgForOf, FormsModule, MatInputModule, MatPaginatorModule, MatIcon, MatIconButton, SaleCardComponent],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.css'
})
export class SalesComponent implements AfterViewInit, OnInit, OnDestroy {
  public salesData: Sale[] = [];
  saleItemCounts: { [bundleId: string]: number } = {};
  console = console;
  searchQuery: string = '';
  totalPages: number = 0;

  // New properties for filtering and sorting
  dateFilter: string = 'all';
  sortBy: string = 'date_desc';
  itemsFilter: string = 'all';
  minProducts: number = 0;
  missingCosts: boolean = false;
  Math = Math; // Make Math available to the template

  isLoading: boolean = false;
  totalRows = 7;
  pageSize = 32;
  currentPage = 1;
  @ViewChild('productRow') productRowElement: ElementRef | undefined;

  private productRowHeight = 30; // Default value

  constructor(public userService: UserService, public salesService: SalesService, public productService: ProductService, public dialog: MatDialog, private router: Router) {

  }

  ngOnInit(): void {
    this.loadData(); // This will update totalRows from the pagination response
  }

  // Add these navigation methods
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

  ngAfterViewInit(): void {
    // Once the view is initialized, measure the actual height of a product row
    if (this.productRowElement && this.productRowElement.nativeElement) {
      this.productRowHeight = this.productRowElement.nativeElement.clientHeight;
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

    // Pass filters to the service
    this.userService.getSales(
      this.pageSize,
      this.currentPage,
      this.searchQuery,
      this.dateFilter,
      this.sortBy,
      this.minProducts,
      this.missingCosts
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
   * Clean up resources when the component is destroyed
   */
  ngOnDestroy(): void {
    // No specific cleanup needed for now
  }
}
