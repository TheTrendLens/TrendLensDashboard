import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {UserService} from '../../services/user.service';
import {take} from 'rxjs';
import {MatTableModule} from '@angular/material/table';
import {DatePipe, NgForOf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatPaginator, MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {MatDialog} from '@angular/material/dialog';
import {MatButton, MatIconButton} from '@angular/material/button';
import {TableSearchBarComponent} from '../table-search-bar/table-search-bar.component';
import {Sale} from '../../models/sale';
import {UploadCsvDialogComponent} from '../upload-csv-dialog/upload-csv-dialog.component';
import {EditSaleDialogComponent} from '../edit-sale-dialog/edit-sale-dialog.component';
import {Router} from '@angular/router';
import {BundleService} from '../../services/bundle.service';
import {MatIcon} from '@angular/material/icon';
import {SalesService} from '../../services/sales.service';
import {ProductService} from '../../services/product.service';
import {Product} from '../../models/product';

@Component({
  selector: 'app-sales',
  imports: [MatTableModule, NgForOf, FormsModule, MatInputModule, MatPaginatorModule, DatePipe, MatIcon, MatIconButton],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.css'
})
export class SalesComponent implements AfterViewInit, OnInit {
  public salesData: Sale[] = [];
  saleItemCounts: { [bundleId: string]: number } = {};
  console = console;
  searchQuery: string = '';
  totalPages: number = 0;

  // New properties for filtering and sorting
  dateFilter: string = 'all';
  sortBy: string = 'date_desc';
  itemsFilter: string = 'all';
  Math = Math; // Make Math available to the template

  isLoading: boolean = false;
  totalRows = 7;
  pageSize = 32;
  currentPage = 1;
  pageSizeOptions: number[] = [5, 10, 25, 100];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(public userService: UserService, public salesService: SalesService, public productService: ProductService, public dialog: MatDialog, private router: Router) {

  }

  ngOnInit(): void {
    this.loadData();
    this.userService.getSalesCount(this.searchQuery, this.dateFilter).pipe(take(1)).subscribe({
      next: (count) => {
        this.totalRows = count;
        this.calculateTotalPages();
      }
    });
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.totalRows / this.pageSize);
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
    // this.listingsData.paginator = this.paginator;
  }

  navigateToBundle(saleId: string): void {
    this.router.navigate(['/sales', saleId]);
  }

  loadData() {
    this.isLoading = true;

    // Pass filters to the service
    this.userService.getSales(
      this.pageSize,
      this.currentPage,
      this.searchQuery,
      this.dateFilter,
      this.sortBy
    ).pipe(take(1)).subscribe({
      next: (sales) => {
        this.salesData = sales;
        this.loadSaleItemCounts();

        // Apply client-side filtering for items count if needed
        if (this.itemsFilter !== 'all') {
          this.applyItemsFilter();
        }

        if (this.paginator) {
          this.paginator.pageIndex = this.currentPage;
        }
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

  /**
   * Apply client-side filtering for items count
   * This is done client-side since we already have the item counts loaded
   */
  applyItemsFilter() {
    if (this.itemsFilter === 'single') {
      this.salesData = this.salesData.filter(sale =>
        this.saleItemCounts[sale.id] === 1
      );
    } else if (this.itemsFilter === 'multiple') {
      this.salesData = this.salesData.filter(sale =>
        this.saleItemCounts[sale.id] > 1
      );
    }
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


  pageChanged(event: any): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.calculateTotalPages();
    this.loadData();
  }

  itemNameFormatter(params: any) {
    let splits: string[] = params.value.split('-');

    splits.reverse().pop();
    splits.reverse();

    splits = splits.map((split) => split.charAt(0).toUpperCase() + split.slice(1));

    return splits.join(' ');
  }

  currencyFormatter(currency: number, sign: string) {
    if (typeof currency !== "number") {
      currency = Number.parseInt(currency);
    }
    if (currency) {
      const sansDec = currency.toFixed(0);
      const formatted = sansDec.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return sign + `${formatted}`;
    }

    return '£0.00';
  }

  openUploadDialog(): void {
    const dialogRef = this.dialog.open(UploadCsvDialogComponent, {
      width: '90%',
      maxWidth: '600px',
      panelClass: 'responsive-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        // Handle successful upload
        console.log('Upload successful:', result.data);
        this.loadData(); // Reload data after successful upload
      }
    });
  }


  onSearch(query: string) {
    this.searchQuery = query;
    this.currentPage = 1; // Reset to first page when search changes

    // Update the total count with the search filter
    this.userService.getSalesCount(query, this.dateFilter).pipe(take(1)).subscribe({
      next: (count) => {
        this.totalRows = count;
        this.calculateTotalPages();
      }
    });

    this.loadData();
  }

  calculateCosts(sale: Sale) {
    return sale.products.reduce((sum, sale) => {
      const itemCost = sale.item_cost;
      if (itemCost === null) return sum;
      return sum + itemCost;
    }, sale.total_fee + sale.seller_postage_cost);
  }

  formatCurrency(value: string | number, sign: string = '£'): string {
    if (value === null || value === undefined) {
      return '£0.00';
    }

    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return '£0.00';
    }

    // Format with 2 decimal places and add commas for thousands
    return sign + numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  getValue(element: any, col: any): any {
    if (col.type === 'number') {
      return col.nestedKey ? element[col.key]?.[col.nestedKey]?.toFixed(2) : element[col.key]?.toFixed(2);
    } else if (col.type === 'lastWord') {
      let value: string | undefined =  col.nestedKey ? element[col.key]?.[col.nestedKey] : element[col.key];
      value = value?.split('-').pop();
      return value!.charAt(0).toUpperCase() + value?.slice(1);
    } else {
      return col.nestedKey ? element[col.key]?.[col.nestedKey] : element[col.key];
    }
  }

  openEditSaleDialog(sale: Sale): void {
    const dialogRef = this.dialog.open(EditSaleDialogComponent, {
      width: '500px',
      data: sale
    });

    dialogRef.afterClosed().subscribe(result => {
      this.loadData();
    })
  }
}
