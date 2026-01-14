import {Component, Input, OnInit, ViewChild, signal, inject, ChangeDetectionStrategy, input} from '@angular/core';
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
import {SalesService} from '../../services/sales.service';

@Component({
  selector: 'app-action-required-tables',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    SaleCardComponent
  ],
  templateUrl: './action-required-tables.component.html',
  styleUrl: './action-required-tables.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActionRequiredTablesComponent implements OnInit {
  public userService = inject(UserService);
  public salesService = inject(SalesService);
  public dialog = inject(MatDialog);
  private router = inject(Router);
  private productService = inject(ProductService);

  console = console;
  Math = Math; // Make Math available to the template

  salesData = signal<Sale[]>([]);
  saleItemCounts = signal<{ [saleId: string]: number }>({});

  salesIsLoading = signal<boolean>(false);
  isMassEditMode = signal<boolean>(false);
  salesTotalRows = signal<number>(1000);
  salesPageSize = signal<number>(32); // Set to 32 as per requirements
  salesCurrentPage = signal<number>(1);
  totalPages = signal<number>(0);
  @ViewChild(MatPaginator) salesPaginator!: MatPaginator;

  metricsComponent = input<StatCardsComponent | undefined>(undefined, { alias: 'metricsComponent' });

  ngOnInit(): void {
    this.loadData();
  }

  calculateTotalPages(): void {
    this.totalPages.set(Math.ceil(this.salesTotalRows() / this.salesPageSize()));
  }

  // Navigation methods for pagination arrows
  goToPreviousPage(): void {
    if (this.salesCurrentPage() > 1) { // Changed from 0 to 1 for 1-based pagination
      this.salesCurrentPage.update(p => p - 1);
      this.loadData();
    }
  }

  goToNextPage(): void {
    if (this.salesCurrentPage() < this.totalPages()) { // Removed -1 for 1-based pagination
      this.salesCurrentPage.update(p => p + 1);
      this.loadData();
    }
  }

  navigateToSale(saleId: string): void {
    this.router.navigate(['/sales', saleId]);
  }

  loadData() {
    this.salesIsLoading.set(true);

    this.salesService.getSales(this.salesPageSize(), this.salesCurrentPage(), '', 'all', 'date_desc', 0, true).pipe(take(1)).subscribe({
      next: (paginatedSales) => {
        this.salesData.set(paginatedSales.items);
        this.salesTotalRows.set(paginatedSales.meta.totalItems);
        this.calculateTotalPages();

        if (this.salesPaginator) {
          this.salesPaginator.pageIndex = this.salesCurrentPage() - 1; // Convert from 1-based to 0-based for paginator
        }
        this.loadSaleItemCounts();
        this.salesIsLoading.set(false);
      },
      error: (error) => {
        console.error(error);
        this.salesIsLoading.set(false);
      }
    })
  }

  loadSaleItemCounts(): void {
    // First, use any products already loaded with the sales
    const currentCounts = {...this.saleItemCounts()};
    this.salesData().forEach(sale => {
      if (sale.products && Array.isArray(sale.products)) {
        // Products are already loaded, use them directly
        currentCounts[sale.id] = sale.products.length;
      } else {
        // Products not loaded, set initial count to 0
        currentCounts[sale.id] = 0;

        // Fetch products for this sale
        this.productService.getProductsBySale(sale.id).subscribe({
          next: (products: Product[]) => {
            this.saleItemCounts.update(counts => ({...counts, [sale.id]: products.length}));
          },
          error: (error) => {
            console.error(`Error fetching products for sale ${sale.id}:`, error);
            this.saleItemCounts.update(counts => ({...counts, [sale.id]: 0}));
          }
        });
      }
    });
    this.saleItemCounts.set(currentCounts);
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

    dialogRef.afterClosed().subscribe(() => {
      this.loadData();

      const metrics = this.metricsComponent();
      if (metrics) {
        metrics.updateStats();
      }
    })
  }

  onSaleUpdated(sale: Sale): void {
    // Update the stat-cards component when a sale is updated
    const metrics = this.metricsComponent();
    if (metrics) {
      metrics.updateStats();
    }
  }

  onProductUpdated(product: Product): void {
    // Update the stat-cards component when a product is updated
    const metrics = this.metricsComponent();
    if (metrics) {
      metrics.updateStats();
    }
  }

  toggleMassEditMode(): void {
    if (this.isMassEditMode()) {
      // Exiting mass edit mode - save all changes
      this.saveMassEditChanges();
    } else {
      // Entering mass edit mode
      this.isMassEditMode.set(true);
    }
  }

  private saveMassEditChanges(): void {
    // In mass edit mode, all changes are saved automatically by individual sale cards
    // We just need to exit mass edit mode
    this.isMassEditMode.set(false);

    // Refresh the data to ensure we have the latest state
    this.loadData();
  }
}
