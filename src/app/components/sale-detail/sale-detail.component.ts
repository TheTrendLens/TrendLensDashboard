import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Sale} from '../../models/sale';
import {take} from 'rxjs';
import {CurrencyPipe, DatePipe, NgForOf, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {EditSaleDialogComponent} from '../edit-sale-dialog/edit-sale-dialog.component';
import {Product} from '../../models/product';
import {SalesService} from '../../services/sales.service';
import {ProductService} from '../../services/product.service';
import {CurrencyService} from '../../services/currency.service';

const PRODUCT_COLUMNS_SCHEMA = [
  {
    key: 'listing',
    nestedKey: 'slug',
    type: 'text',
    label: 'Listing'
  },
  {
    key: 'date_sold',
    type: 'text',
    label: 'Date Sold'
  },
  {
    key: 'listing',
    nestedKey: 'date_listed',
    type: 'text',
    label: 'Date Listed'
  },
  {
    key: 'listing',
    nestedKey: 'listed_price',
    type: 'number',
    label: 'Listed Price'
  },
  {
    key: 'total',
    type: 'number',
    label: 'Total'
  },
  {
    key: 'size',
    type: 'text',
    label: 'Size'
  },
  {
    key: 'platform_fee',
    type: 'number',
    label: 'Platform Fee'
  },
  {
    key: 'payment_fee',
    type: 'number',
    label: 'Payment Fee'
  },
  {
    key: 'seller_postage_cost',
    type: 'number',
    label: 'Postage Cost'
  },
  {
    key: 'item_cost',
    type: 'number',
    label: 'Item Cost'
  },
  {
    key: 'isEdit',
    type: 'isEdit',
    label: ''
  }
];

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [
    NgForOf,
    NgIf,
    FormsModule,
    DatePipe,
    CurrencyPipe
  ],
  templateUrl: './sale-detail.component.html',
  styleUrls: ['./sale-detail.component.css']
})
export class SaleDetailComponent implements OnInit {
  sale: Sale | null = null;
  products: Product[] = [];
  isLoading = true;
  editingPostage = false;
  originalPostageCost: number | null = null;
  editingItemCost: { [key: string]: boolean } = {};
  originalItemCosts: { [key: string]: number } = {};

  displayedColumns: string[] = PRODUCT_COLUMNS_SCHEMA.map((col) => col.nestedKey ? col.nestedKey : col.key);
  columnsSchema: any = PRODUCT_COLUMNS_SCHEMA;

  constructor(
    private route: ActivatedRoute,
    private salesService: SalesService,
    private productService: ProductService,
    public dialog: MatDialog,
    private currencyService: CurrencyService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const saleId = params.get('id');
      if (saleId) {
        this.loadBundleData(saleId);
      }
    });
  }

  loadBundleData(saleId: string): void {
    this.isLoading = true;

    // Load sales details
    this.salesService.findOne(saleId).pipe(take(1)).subscribe({
      next: (sale) => {
        this.sale = sale;
        this.loadProductsData(saleId);
      },
      error: (error) => {
        console.error('Error loading sale:', error);
        this.isLoading = false;
      }
    });
  }

  loadProductsData(saleId: string): void {
    // Load products for this sale
    this.productService.getProductsBySale(saleId).pipe(take(1)).subscribe({
      next: (products) => {
        this.products = products;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
      }
    });
  }

  getValue(element: any, col: any): any {
    if (col.type === 'number') {
      return col.nestedKey ? element[col.key]?.[col.nestedKey]?.toFixed(2) : element[col.key]?.toFixed(2);
    } else if (col.type === 'slug') {
      let value: string = col.nestedKey ? element[col.key]?.[col.nestedKey] : element[col.key];
      value = value.replaceAll('-', ' ');
      return value!.charAt(0).toUpperCase() + value?.slice(1);
    } else {
      return col.nestedKey ? element[col.key]?.[col.nestedKey] : element[col.key];
    }
  }
  get totalItemCosts(): number {
    return this.products.reduce((sum, sale) => {
      const itemCost = sale.item_cost;
      if (itemCost === null) return sum;
      return sum + (typeof itemCost === 'string' ? parseFloat(itemCost) : itemCost);
    }, 0);
  }

  get totalProfit(): number {
    if (this.sale)
      return this.sale?.total - (this.sale.platform_fee || 0) - (this.sale.payment_fee || 0) - (this.sale.seller_postage_cost || 0) - this.totalItemCosts;

    return 0.00;
  }

  // Postage cost editing methods
  startEditingPostage(): void {
    if (!this.sale) return;
    this.editingPostage = true;
    this.originalPostageCost = this.sale.seller_postage_cost;
  }

  savePostage(): void {
    if (!this.sale) return;
    this.salesService.update(this.sale).subscribe({
      next: (updatedSale) => {
        this.sale = updatedSale;
        this.editingPostage = false;
        this.originalPostageCost = null;
      },
      error: (error) => {
        console.error('Error updating postage cost:', error);
        this.cancelEditingPostage();
      }
    });
  }

  cancelEditingPostage(): void {
    if (!this.sale || this.originalPostageCost === null) return;
    this.sale.seller_postage_cost = this.originalPostageCost;
    this.editingPostage = false;
    this.originalPostageCost = null;
  }

  // Item cost editing methods
  startEditingItemCost(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    this.editingItemCost[productId] = true;
    this.originalItemCosts[productId] = product.item_cost;
  }

  saveItemCost(product: Product): void {
    if (!product) return;

    this.productService.update(product).subscribe({
      next: (updatedProduct) => {
        // Find and update the product in the local array
        const index = this.products.findIndex(p => p.id === updatedProduct.id);
        if (index !== -1) {
          this.products[index] = updatedProduct;
        }

        this.editingItemCost[product.id] = false;
        delete this.originalItemCosts[product.id];
      },
      error: (error) => {
        console.error('Error updating item cost:', error);
        this.cancelEditingItemCost(product.id);
      }
    });
  }

  cancelEditingItemCost(productId: string): void {
    const product = this.products.find(p => p.id === productId);
    if (!product || !(productId in this.originalItemCosts)) return;

    product.item_cost = this.originalItemCosts[productId];
    this.editingItemCost[productId] = false;
    delete this.originalItemCosts[productId];
  }

  /**
   * Gets the current currency code from the CurrencyService
   * This is used by the CurrencyPipe in the template
   */
  getCurrencyCode(): string {
    const currencySymbol = this.currencyService.getCurrencySymbol();
    const currencyOption = this.currencyService.getCurrencyBySymbol(currencySymbol);
    return currencyOption?.code || 'GBP';
  }
}
