import {Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Sale} from '../../models/sale';
import {take} from 'rxjs';
import {CurrencyPipe, DatePipe, NgForOf, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {Product} from '../../models/product';
import {SalesService} from '../../services/sales.service';
import {ProductService} from '../../services/product.service';
import {CurrencyService} from '../../services/currency.service';
import {AddProductDialogComponent} from '../add-product-dialog/add-product-dialog.component';
import {FeatureFlagService} from '../../services/feature-flag.service';
import { createSaleLabel } from '../../utils/sale-label.util';
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
  experimentalFeaturesEnabled: boolean = false;

  @ViewChild('postageCostInput') postageCostInput: ElementRef | undefined;
  @ViewChildren('itemCostInput') itemCostInputs: QueryList<ElementRef> | undefined;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private salesService: SalesService,
    private productService: ProductService,
    public dialog: MatDialog,
    private currencyService: CurrencyService,
    private featureFlagService: FeatureFlagService,
  ) {
    // Initialize experimental features state
    this.experimentalFeaturesEnabled = this.featureFlagService.getExperimentalFeaturesEnabled();
    this.featureFlagService.isExperimentalFeaturesEnabled().subscribe(enabled => {
      this.experimentalFeaturesEnabled = enabled;
    });}

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

  // Derived sale label based on loaded products
  get saleLabel(): string {
    try {
      return createSaleLabel(this.products, this.sale?.date_sold || undefined as unknown as Date);
    } catch {
      return 'Sale';
    }
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

    setTimeout(() => {
      if (this.postageCostInput) {
        this.postageCostInput.nativeElement.focus();
        this.postageCostInput.nativeElement.select();
      }
    });

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

    setTimeout(() => {
      if (this.itemCostInputs) {
        const inputElement = this.itemCostInputs.find(el =>
          el.nativeElement.closest('div').querySelector(`[ng-reflect-model="${product.item_cost}"]`));
        if (inputElement) {
          inputElement.nativeElement.focus();
          inputElement.nativeElement.select();
        }
      }
    })
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

  /**
   * Opens a dialog to add a new product to the sale
   */
  addProduct(): void {
    if (!this.sale) return;

    const dialogRef = this.dialog.open(AddProductDialogComponent, {
      width: '600px',
      data: { saleId: this.sale.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Create the product
        // @ts-ignore
        this.productService.create({
            sale: result.saleId,
            listing: result.listingId,
            size: result.size,
            item_cost: result.itemCost
          }
        ).subscribe({
          next: (newProduct) => {
            // Add the new product to the local array
            this.products.push(newProduct);
          },
          error: (error) => {
            console.error('Error creating product:', error);
          }
        });
      }
    });
  }

  /**
   * Removes a product from the sale
   */
  removeProduct(productId: string): void {
    if (confirm('Are you sure you want to remove this product?')) {
      this.productService.delete(productId).subscribe({
        next: () => {
          // Remove the product from the local array
          this.products = this.products.filter(p => p.id !== productId);
        },
        error: (error) => {
          console.error('Error deleting product:', error);
        }
      });
    }
  }

  /**
   * Deletes the entire sale and navigates back to the sales list
   */
  deleteSale(): void {
    if (!this.sale) return;

    if (confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
      this.salesService.delete(this.sale.id).subscribe({
        next: () => {
          // Navigate back to the sales list
          this.router.navigate(['/sales']);
        },
        error: (error) => {
          console.error('Error deleting sale:', error);
        }
      });
    }
  }
}
