import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {NgForOf} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatPaginator} from '@angular/material/paginator';
import {Sale} from '../../models/sale';
import {take} from 'rxjs';
import {UserService} from '../../services/user.service';
import {MatDialog} from '@angular/material/dialog';
import {EditSaleDialogComponent} from '../edit-sale-dialog/edit-sale-dialog.component';
import {StatCardsComponent} from '../stat-cards/stat-cards.component';
import {Router} from '@angular/router';
import {Product} from '../../models/product';
import {ProductService} from '../../services/product.service';
import {SaleCardComponent} from '../sale-card/sale-card.component';

@Component({
  selector: 'app-action-required-tables',
  imports: [
    NgForOf,
    ReactiveFormsModule,
    FormsModule,
    SaleCardComponent
  ],
  templateUrl: './action-required-tables.component.html',
  styleUrl: './action-required-tables.component.css'
})
export class ActionRequiredTablesComponent implements OnInit {
  console = console;
  Math = Math; // Make Math available to the template

  public salesData: Sale[] = [];
  saleItemCounts: { [saleId: string]: number } = {};

  salesIsLoading: boolean = false;
  salesTotalRows = 1000;
  salesPageSize = 1000;
  salesCurrentPage = 1;
  totalPages: number = 0;
  @ViewChild(MatPaginator) salesPaginator!: MatPaginator;

  @Input('metricsComponent') metricsComponent: StatCardsComponent | undefined

  constructor(
    public userService: UserService,
    public dialog: MatDialog,
    private router: Router,
    private productService: ProductService
  ) {

  }

  ngOnInit(): void {
    this.loadData();
  }

  calculateTotalPages(): void {
    this.totalPages = Math.ceil(this.salesTotalRows / this.salesPageSize);
  }

  // Navigation methods for pagination arrows
  goToPreviousPage(): void {
    if (this.salesCurrentPage > 1) { // Changed from 0 to 1 for 1-based pagination
      this.salesCurrentPage--;
      this.loadData();
    }
  }

  goToNextPage(): void {
    if (this.salesCurrentPage < this.totalPages) { // Removed -1 for 1-based pagination
      this.salesCurrentPage++;
      this.loadData();
    }
  }

  navigateToSale(saleId: string): void {
    this.router.navigate(['/sales', saleId]);
  }

  loadData() {
    this.salesIsLoading = true;

    this.userService.getSalesWithMissingData(this.salesPageSize, this.salesCurrentPage).pipe(take(1)).subscribe({
      next: (paginatedSales) => {
        this.salesData = paginatedSales.items;
        this.salesTotalRows = paginatedSales.meta.totalItems;
        this.calculateTotalPages();

        if (this.salesPaginator) {
          this.salesPaginator.pageIndex = this.salesCurrentPage - 1; // Convert from 1-based to 0-based for paginator
        }
        this.loadSaleItemCounts();
        this.salesIsLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.salesIsLoading = false;
      }
    })
  }

  loadSaleItemCounts(): void {
    this.salesData.forEach(sale => {
      this.productService.getProductsBySale(sale.id).subscribe({
        next: (products: Product[]) => {
          this.saleItemCounts[sale.id] = products.length;
        },
        error: (error) => {
          console.error(`Error fetching products for sale ${sale.id}:`, error);
          this.saleItemCounts[sale.id] = 0;
        }
      });
    });
  }

  getValue(element: any, col: any): any {
    if (col.type === 'number') {
      return col.nestedKey ? element[col.key]?.[col.nestedKey]?.toFixed(2) : element[col.key]?.toFixed(2);
    } else if (col.type === 'lastWord') {
      let value: string | undefined = col.nestedKey ? element[col.key]?.[col.nestedKey] : element[col.key];
      value = value?.split('-').pop();
      return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
    } else {
      return col.nestedKey ? element[col.key]?.[col.nestedKey] : element[col.key];
    }
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

  calculateCosts(sale: Sale) {
    return sale.products?.reduce((sum, product) => {
      const itemCost = product.item_cost;
      if (itemCost === null) return sum;
      return sum + itemCost;
    }, sale.total_fee + sale.seller_postage_cost) || 0;
  }

  openEditSaleDialog(sale: Sale): void {
    const dialogRef = this.dialog.open(EditSaleDialogComponent, {
      width: '500px',
      data: sale
    });

    dialogRef.afterClosed().subscribe(result => {
      this.loadData();

      if (this.metricsComponent) {
        this.metricsComponent.updateStats();
      }
    })
  }
}
