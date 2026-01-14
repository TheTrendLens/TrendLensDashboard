import {
  Component,
  input,
  output,
  ElementRef,
  ViewChild,
  AfterViewInit,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy
} from '@angular/core';
import {CommonModule, DatePipe, CurrencyPipe} from '@angular/common';
import { Listing } from '../../models/listing';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ListingService} from '../../services/listing.service';
import {MatDialog} from '@angular/material/dialog';
import {CurrencyService} from '../../services/currency.service';

@Component({
  selector: 'app-listing-card',
  templateUrl: './listing-card.component.html',
  styleUrls: ['./listing-card.component.css'],
  imports: [CommonModule, DatePipe, ReactiveFormsModule, FormsModule, CurrencyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListingCardComponent implements AfterViewInit {
  private listingService = inject(ListingService);
  public dialog = inject(MatDialog);
  private currencyService = inject(CurrencyService);

  listing = input.required<Listing>();
  canEdit = input<boolean>(false);
  cardClick = output<string>();
  listingDeleted = output<string>();

  editingItemCost = signal<boolean>(false);
  originalItemCost = signal<number | null>(null);

  Math = Math; // Make Math available to the template

  @ViewChild('itemCostInput') itemCostInput: ElementRef | undefined;

  ngAfterViewInit(): void {
    // Initialization after view is loaded
  }

  // Check if any edits are in progress
  isEditing = computed(() => {
    return this.editingItemCost();
  });

  onCardClick(): void {
    if (!this.isEditing()) {
      this.cardClick.emit(this.listing().id);
    }
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

  // Item cost editing methods
  startEditingItemCost(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const l = this.listing();
    if (!l) return;
    this.editingItemCost.set(true);
    this.originalItemCost.set(l.item_cost);

    setTimeout(() => {
      if (this.itemCostInput) {
        this.itemCostInput.nativeElement.focus();
        this.itemCostInput.nativeElement.select();
      }
    });
  }

  saveItemCost(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const l = this.listing();
    if (!l) return;

    this.listingService.update(l).subscribe({
      next: (updatedListing) => {
        // Since input is signal, we can't easily modify it locally.
        // Usually the parent will refresh.
        this.editingItemCost.set(false);
        this.originalItemCost.set(null);
      },
      error: (error) => {
        console.error('Error updating item cost:', error);
        this.cancelEditingItemCost();
      }
    });
  }

  cancelEditingItemCost(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const l = this.listing();
    const original = this.originalItemCost();
    if (!l || original === null) return;
    l.item_cost = original;
    this.editingItemCost.set(false);
    this.originalItemCost.set(null);
  }

  deleteListing(event: Event): void {
    event.stopPropagation();
    const l = this.listing();
    if (confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      this.listingService.delete(l.id).subscribe({
        next: () => {
          this.listingDeleted.emit(l.id);
        },
        error: (error) => {
          console.error('Error deleting listing:', error);
          alert('Error deleting listing. It might be linked to existing sales.');
        }
      });
    }
  }
}
