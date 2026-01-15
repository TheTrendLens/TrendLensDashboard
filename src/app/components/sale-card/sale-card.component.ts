import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  QueryList,
  ViewChild,
  ViewChildren
} from '@angular/core';
import {CurrencyPipe, DatePipe, NgClass, NgForOf, NgIf} from '@angular/common';
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
  standalone: true,
  imports: [NgForOf, NgIf, DatePipe, ReactiveFormsModule, FormsModule, NgClass, CurrencyPipe]
})
export class SaleCardComponent implements AfterViewInit {
  @Input() sale!: Sale;
  @Input() itemCount: number | undefined;
  @Input() canEdit: boolean = false;
  @Input() isMassEditMode: boolean = false;
  @Output() cardClick = new EventEmitter<string>();
  @Output() saleUpdated = new EventEmitter<Sale>();
  @Output() productUpdated = new EventEmitter<Product>();
  editingPostage = false;
  originalPostageCost: number | null = null;
  editingItemCost: { [key: string]: boolean } = {};
  originalItemCosts: { [key: string]: number } = {};

  Math = Math; // Make Math available to the template

  // Product display limits
  private productRowHeight = 30; // Default value

  @ViewChild('productRow') productRowElement: ElementRef | undefined;
  @ViewChild('postageCostInput') postageCostInput: ElementRef | undefined;
  @ViewChildren('itemCostInput') itemCostInputs: QueryList<ElementRef> | undefined;


  constructor(
    private route: ActivatedRoute,
    private salesService: SalesService,
    private productService: ProductService,
    public dialog: MatDialog,
    private currencyService: CurrencyService
  ) {}

  ngAfterViewInit(): void {
    // Once the view is initialized, measure the actual height of a product row
    if (this.productRowElement && this.productRowElement.nativeElement) {
      this.productRowHeight = this.productRowElement.nativeElement.clientHeight;
    }
  }

  // Check if any edits are in progress
  get isEditing(): boolean {
    return Object.values(this.editingItemCost).some(value => value) || this.editingPostage;
  }

  onCardClick(): void {
    if (!this.isEditing && !this.isMassEditMode) {
      this.cardClick.emit(this.sale.id);
    }
  }

  // Derived, concise label for this sale based on its products
  get saleLabel(): string {
    try {
      return createSaleLabel(this.sale?.products, this.sale?.date_sold);
    } catch {
      return 'Sale';
    }
  }

  calculateCosts(sale: Sale) {
    return sale.products?.reduce((sum, product) => {
      const itemCost = +product.item_cost;
      if (itemCost === null) return sum;
      return sum + itemCost;
    }, +sale.total_fee + +sale.seller_postage_cost) || 0;
  }

  /**
   * Gets the current currency code from the CurrencyService
   * This is used by the CurrencyPipe in the template
   */
  getCurrencyCode(): string {
    return this.currencyService.getCurrencyCode();
  }

  getCurrencySymbol(): string {
    return this.currencyService.getCurrencySymbol();
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

  /**
   * Get a limited number of products based on card height
   * @param products The full list of products
   * @param cardElement The DOM element of the card
   * @returns A limited list of products
   */
  getLimitedProducts(products: any[], cardElement?: HTMLElement): any[] {
    // Default to a reasonable limit for SSR or if element isn't provided
    if (typeof window === 'undefined' || !cardElement) {
      return products.slice(0, 2);
    }

    // Get the card height
    const cardHeight = cardElement.clientHeight;

    // Calculate available space for products
    const reservedSpace = 150; // Space for header and footer
    const availableHeight = cardHeight - reservedSpace;

    // Calculate how many products can fit using the measured row height
    const visibleProducts = Math.max(1, Math.floor(availableHeight / this.productRowHeight));

    return products.slice(0, visibleProducts);
  }

  /**
   * Check if there are more products than the limit
   * @param products The full list of products
   * @param cardElement The DOM element of the card
   * @returns True if there are more products than the limit
   */
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

  // Postage cost editing methods
  startEditingPostage(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

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

  savePostage(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!this.sale) return;
    this.salesService.update(this.sale).subscribe({
      next: (updatedSale) => {
        let products = this.sale.products;
        this.sale = updatedSale;
        this.sale.products = products;
        this.editingPostage = false;
        this.originalPostageCost = null;
        // Emit the updated sale
        this.saleUpdated.emit(this.sale);
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

    if (!this.sale || this.originalPostageCost === null) return;
    this.sale.seller_postage_cost = this.originalPostageCost;
    this.editingPostage = false;
    this.originalPostageCost = null;
  }

  // Item cost editing methods
  startEditingItemCost(productId: string, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const product = this.sale.products.find(p => p.id === productId);
    if (!product) return;

    this.editingItemCost[productId] = true;
    this.originalItemCosts[productId] = product.item_cost;

    setTimeout(() => {
      if (this.itemCostInputs) {
        // Find the input element with the matching product ID data attribute
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

    // Ensure the product has the sale reference as required by the backend
    if (!product.sale && this.sale) {
      // @ts-ignore
      product.sale = { id: this.sale.id };
    }

    this.productService.update(product).subscribe({
      next: (updatedProduct) => {
        // Find and update the product in the local array
        const index = this.sale.products.findIndex(p => p.id === updatedProduct.id);
        if (index !== -1) {
          this.sale.products[index] = updatedProduct;
        }

        this.editingItemCost[product.id] = false;
        delete this.originalItemCosts[product.id];

        // Emit the updated product
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

    const product = this.sale.products.find(p => p.id === productId);
    if (!product || !(productId in this.originalItemCosts)) return;

    product.item_cost = this.originalItemCosts[productId];
    this.editingItemCost[productId] = false;
    delete this.originalItemCosts[productId];
  }
}
