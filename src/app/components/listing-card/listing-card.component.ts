import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import {NgForOf, NgIf, DatePipe, NgClass, CurrencyPipe} from '@angular/common';
import { Listing } from '../../models/listing';
import { MatIcon } from '@angular/material/icon';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {ListingService} from '../../services/listing.service';
import {MatDialog} from '@angular/material/dialog';
import {CurrencyService} from '../../services/currency.service';

@Component({
  selector: 'app-listing-card',
  templateUrl: './listing-card.component.html',
  styleUrls: ['./listing-card.component.css'],
  standalone: true,
  imports: [NgIf, DatePipe, ReactiveFormsModule, FormsModule, NgClass, CurrencyPipe]
})
export class ListingCardComponent implements AfterViewInit {
  @Input() listing!: Listing;
  @Input() canEdit: boolean = false;
  @Output() cardClick = new EventEmitter<string>();
  editingItemCost = false;
  originalItemCost: number | null = null;

  Math = Math; // Make Math available to the template

  @ViewChild('itemCostInput') itemCostInput: ElementRef | undefined;

  constructor(
    private route: ActivatedRoute,
    private listingService: ListingService,
    public dialog: MatDialog,
    private currencyService: CurrencyService
  ) {}

  ngAfterViewInit(): void {
    // Initialization after view is loaded
  }

  // Check if any edits are in progress
  get isEditing(): boolean {
    return this.editingItemCost;
  }

  onCardClick(): void {
    if (!this.isEditing) {
      this.cardClick.emit(this.listing.id);
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

    if (!this.listing) return;
    this.editingItemCost = true;
    this.originalItemCost = this.listing.item_cost;

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

    if (!this.listing) return;

    this.listingService.update(this.listing).subscribe({
      next: (updatedListing) => {
        this.listing = updatedListing;
        this.editingItemCost = false;
        this.originalItemCost = null;
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

    if (!this.listing || this.originalItemCost === null) return;
    this.listing.item_cost = this.originalItemCost;
    this.editingItemCost = false;
    this.originalItemCost = null;
  }
}
