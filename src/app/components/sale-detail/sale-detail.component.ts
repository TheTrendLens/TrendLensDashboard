import {Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren, signal, computed, inject, ChangeDetectionStrategy} from '@angular/core';
import {ActivatedRoute, Router, RouterModule} from '@angular/router';
import {Sale} from '../../models/sale';
import {take} from 'rxjs';
import {CommonModule, CurrencyPipe, DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatDialog} from '@angular/material/dialog';
import {Product} from '../../models/product';
import {SalesService} from '../../services/sales.service';
import {ProductService} from '../../services/product.service';
import {CurrencyService} from '../../services/currency.service';
import {AddProductDialogComponent} from '../add-product-dialog/add-product-dialog.component';
import {CreateSaleFlowDialogComponent} from '../create-sale-flow-dialog/create-sale-flow-dialog.component';
import {FeatureFlagService} from '../../services/feature-flag.service';
import { createSaleLabel } from '../../utils/sale-label.util';
import {MatIcon} from '@angular/material/icon';
import {MatButton, MatIconButton} from '@angular/material/button';

@Component({
  selector: 'app-sale-detail',
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    CurrencyPipe,
    MatIcon,
    MatButton,
    MatIconButton,
    RouterModule
  ],
  templateUrl: './sale-detail.component.html',
  styleUrls: ['./sale-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaleDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private salesService = inject(SalesService);
  private productService = inject(ProductService);
  public dialog = inject(MatDialog);
  private currencyService = inject(CurrencyService);
  private featureFlagService = inject(FeatureFlagService);

  sale = signal<Sale | null>(null);
  products = signal<Product[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  editingPostage = signal<boolean>(false);
  originalPostageCost = signal<number | null>(null);
  editingItemCost = signal<{ [key: string]: boolean }>({});
  originalItemCosts = signal<{ [key: string]: number }>({});
  experimentalFeaturesEnabled = signal<boolean>(false);

  @ViewChild('postageCostInput') postageCostInput: ElementRef | undefined;
  @ViewChildren('itemCostInput') itemCostInputs: QueryList<ElementRef> | undefined;

  constructor() {
    // Initialize experimental features state
    this.experimentalFeaturesEnabled.set(this.featureFlagService.getExperimentalFeaturesEnabled());
    this.featureFlagService.isExperimentalFeaturesEnabled().subscribe(enabled => {
      this.experimentalFeaturesEnabled.set(enabled);
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const saleId = params.get('id');
      if (saleId) {
        this.loadBundleData(saleId);
      }
    });
  }

  loadBundleData(saleId: string): void {
    this.isLoading.set(true);

    // Load sales details
    this.salesService.findOne(saleId).pipe(take(1)).subscribe({
      next: (sale) => {
        this.sale.set(sale);
        this.loadProductsData(saleId);
      },
      error: (error) => {
        console.error('Error loading sale:', error);
        this.isLoading.set(false);
      }
    });
  }

  loadProductsData(saleId: string): void {
    // Load products for this sale
    this.productService.getProductsBySale(saleId).pipe(take(1)).subscribe({
      next: (products) => {
        this.products.set(products);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading.set(false);
      }
    });
  }

  // Derived sale label based on loaded products
  saleLabel = computed(() => {
    try {
      return createSaleLabel(this.products(), this.sale()?.date_sold || undefined as unknown as Date);
    } catch {
      return 'Sale';
    }
  });

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

  totalItemCosts = computed(() => {
    return this.products().reduce((sum, p) => {
      const itemCost = p.item_cost;
      if (itemCost === null) return sum;
      return sum + (typeof itemCost === 'string' ? parseFloat(itemCost) : itemCost);
    }, 0);
  });

  totalProfit = computed(() => {
    const s = this.sale();
    if (s) {
      return s.total - (s.platform_fee || 0) - (s.payment_fee || 0) - (s.seller_postage_cost || 0) - this.totalItemCosts();
    }
    return 0.00;
  });

  // Postage cost editing methods
  startEditingPostage(): void {
    const s = this.sale();
    if (!s) return;
    this.editingPostage.set(true);
    this.originalPostageCost.set(s.seller_postage_cost);

    setTimeout(() => {
      if (this.postageCostInput) {
        this.postageCostInput.nativeElement.focus();
        this.postageCostInput.nativeElement.select();
      }
    });
  }

  savePostage(): void {
    const s = this.sale();
    if (!s) return;
    this.salesService.update(s).subscribe({
      next: (updatedSale) => {
        this.sale.set(updatedSale);
        this.editingPostage.set(false);
        this.originalPostageCost.set(null);
      },
      error: (error) => {
        console.error('Error updating postage cost:', error);
        this.cancelEditingPostage();
      }
    });
  }

  cancelEditingPostage(): void {
    const s = this.sale();
    const original = this.originalPostageCost();
    if (!s || original === null) return;
    this.sale.update(val => val ? {...val, seller_postage_cost: original} : null);
    this.editingPostage.set(false);
    this.originalPostageCost.set(null);
  }

  // Item cost editing methods
  startEditingItemCost(productId: string): void {
    const product = this.products().find(p => p.id === productId);
    if (!product) return;

    this.editingItemCost.update(map => ({...map, [productId]: true}));
    this.originalItemCosts.update(map => ({...map, [productId]: product.item_cost}));

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
        this.products.update(list => list.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        this.editingItemCost.update(map => {
          const newMap = {...map};
          delete newMap[product.id];
          return newMap;
        });
        this.originalItemCosts.update(map => {
          const newMap = {...map};
          delete newMap[product.id];
          return newMap;
        });
      },
      error: (error) => {
        console.error('Error updating item cost:', error);
        this.cancelEditingItemCost(product.id);
      }
    });
  }

  cancelEditingItemCost(productId: string): void {
    const originalMap = this.originalItemCosts();
    if (!(productId in originalMap)) return;

    this.products.update(list => list.map(p => p.id === productId ? {...p, item_cost: originalMap[productId]} : p));
    this.editingItemCost.update(map => {
      const newMap = {...map};
      delete newMap[productId];
      return newMap;
    });
    this.originalItemCosts.update(map => {
      const newMap = {...map};
      delete newMap[productId];
      return newMap;
    });
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
    const s = this.sale();
    if (!s) return;

    const dialogRef = this.dialog.open(AddProductDialogComponent, {
      width: '600px',
      data: { saleId: s.id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Create the product
        this.productService.create({
            sale: result.saleId,
            listing: result.listingId,
            size: result.size,
            item_cost: result.itemCost
          } as Product
        ).subscribe({
          next: (newProduct) => {
            // Add the new product to the local array
            this.products.update(list => [...list, newProduct]);
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
          this.products.update(list => list.filter(p => p.id !== productId));
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
    const s = this.sale();
    if (!s) return;

    if (confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
      this.salesService.delete(s.id).subscribe({
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
