import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  input,
  output,
  QueryList,
  ViewChild,
  ViewChildren,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import {CurrencyPipe, DatePipe, CommonModule} from '@angular/common';
import {Sale} from '../../models/sale';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Product} from '../../models/product';
import {ActivatedRoute} from '@angular/router';
import {SalesService} from '../../services/sales.service';
import {ProductService} from '../../services/product.service';
import {MatDialog} from '@angular/material/dialog';
import {CurrencyService} from '../../services/currency.service';
import { createSaleLabel } from '../../utils/sale-label.util';

@Component({
  selector: 'app-sale-card',
  templateUrl: './sale-card.component.html',
  styleUrls: ['./sale-card.component.css'],
  imports: [CommonModule, DatePipe, ReactiveFormsModule, FormsModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SaleCardComponent implements AfterViewInit {
  private route = inject(ActivatedRoute);
  private salesService = inject(SalesService);
  private productService = inject(ProductService);
  public dialog = inject(MatDialog);
  private currencyService = inject(CurrencyService);

  sale = input.required<Sale>();
  itemCount = input<number | undefined>();
  canEdit = input<boolean>(false);
  isMassEditMode = input<boolean>(false);

  cardClick = output<string>();
  saleUpdated = output<Sale>();
  saleDeleted = output<string>();
  productUpdated = output<Product>();

  editingPostage = signal<boolean>(false);
  originalPostageCost = signal<number | null>(null);
  editingItemCost = signal<{ [key: string]: boolean }>({});
  originalItemCosts = signal<{ [key: string]: number }>({});

  Math = Math;

  private productRowHeight = 30;

  @ViewChild('productRow') productRowElement: ElementRef | undefined;
  @ViewChild('postageCostInput') postageCostInput: ElementRef | undefined;
  @ViewChildren('itemCostInput') itemCostInputs: QueryList<ElementRef> | undefined;

  ngAfterViewInit(): void {
    if (this.productRowElement && this.productRowElement.nativeElement) {
      this.productRowHeight = this.productRowElement.nativeElement.clientHeight;
    }
  }

  isEditing = computed(() => {
    return Object.values(this.editingItemCost()).some(value => value) || this.editingPostage();
  });

  onCardClick(): void {
    if (!this.isEditing() && !this.isMassEditMode()) {
      this.cardClick.emit(this.sale().id);
    }
  }

  saleLabel = computed(() => {
    try {
      const s = this.sale();
      return createSaleLabel(s?.products, s?.date_sold);
    } catch {
      return 'Sale';
    }
  });

  calculateCosts(sale: Sale) {
    return sale.products?.reduce((sum, product) => {
      const itemCost = +product.item_cost;
      if (itemCost === null) return sum;
      return sum + itemCost;
    }, +sale.total_fee + +sale.seller_postage_cost) || 0;
  }

  getCurrencyCode(): string {
    const currencySymbol = this.currencyService.getCurrencySymbol();
    const currencyOption = this.currencyService.getCurrencyBySymbol(currencySymbol);
    return currencyOption?.code || 'GBP';
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

  getLimitedProducts(products: any[], cardElement?: HTMLElement): any[] {
    if (typeof window === 'undefined' || !cardElement) {
      return products.slice(0, 2);
    }
    const cardHeight = cardElement.clientHeight;
    const reservedSpace = 150;
    const availableHeight = cardHeight - reservedSpace;
    const visibleProducts = Math.max(1, Math.floor(availableHeight / this.productRowHeight));
    return products.slice(0, visibleProducts);
  }

  hasMoreProducts(products: any[], cardElement?: HTMLElement): boolean {
    if (typeof window === 'undefined' || !cardElement) {
      return products.length > 2;
    }
    const cardHeight = cardElement.clientHeight;
    const productRowHeight = 50;
    const reservedSpace = 150;
    const availableHeight = cardHeight - reservedSpace;
    const visibleProducts = Math.max(1, Math.floor(availableHeight / productRowHeight));
    return products.length > visibleProducts;
  }

  startEditingPostage(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
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

  savePostage(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const s = this.sale();
    if (!s) return;
    this.salesService.update(s).subscribe({
      next: (updatedSale) => {
        // Since input is signal, we can't easily modify it locally if it's meant to be immutable from parent.
        // But usually the parent will refresh.
        this.editingPostage.set(false);
        this.originalPostageCost.set(null);
        this.saleUpdated.emit(updatedSale);
      },
      error: (error) => {
        console.error('Error updating postage cost:', error);
        this.cancelEditingPostage();
      }
    });
  }

  cancelEditingPostage(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const s = this.sale();
    const original = this.originalPostageCost();
    if (!s || original === null) return;
    s.seller_postage_cost = original;
    this.editingPostage.set(false);
    this.originalPostageCost.set(null);
  }

  startEditingItemCost(productId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const product = this.sale().products.find(p => p.id === productId);
    if (!product) return;
    this.editingItemCost.update(map => ({...map, [productId]: true}));
    this.originalItemCosts.update(map => ({...map, [productId]: product.item_cost}));
    setTimeout(() => {
      if (this.itemCostInputs) {
        const inputElement = this.itemCostInputs.find(el =>
          el.nativeElement.getAttribute('data-product-id') === productId
        );
        if (inputElement) {
          inputElement.nativeElement.focus();
          inputElement.nativeElement.select();
        }
      }
    }, 0);
  }

  saveItemCost(product: Product, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!product) return;
    this.productService.update(product).subscribe({
      next: (updatedProduct) => {
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
        this.productUpdated.emit(updatedProduct);
      },
      error: (error) => {
        console.error('Error updating item cost:', error);
        this.cancelEditingItemCost(product.id);
      }
    });
  }

  cancelEditingItemCost(productId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const product = this.sale().products.find(p => p.id === productId);
    const originalMap = this.originalItemCosts();
    if (!product || !(productId in originalMap)) return;
    product.item_cost = originalMap[productId];
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

  deleteSale(event: Event): void {
    event.stopPropagation();
    const s = this.sale();
    if (confirm('Are you sure you want to delete this sale? This will also return items to stock.')) {
      this.salesService.delete(s.id).subscribe({
        next: () => {
          this.saleDeleted.emit(s.id);
        },
        error: (error) => {
          console.error('Error deleting sale:', error);
          alert('Error deleting sale.');
        }
      });
    }
  }
}
