import {Component, inject, OnInit, signal, ChangeDetectionStrategy} from '@angular/core';
import {UserService} from '../../services/user.service';
import {take} from 'rxjs';
import {MatTableModule} from '@angular/material/table';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatDialog} from '@angular/material/dialog';
import {MatIconButton} from '@angular/material/button';
import {Router} from '@angular/router';
import {MatIcon} from '@angular/material/icon';
import {ListingService} from '../../services/listing.service';
import {Listing} from '../../models/listing';
import {FeatureFlagService} from '../../services/feature-flag.service';
import {AddListingDialogComponent} from '../add-listing-dialog/add-listing-dialog.component';
import {ListingCardComponent} from '../listing-card/listing-card.component';
import {TourService} from '../../services/tour.service';

@Component({
  selector: 'app-listings',
  imports: [MatTableModule, CommonModule, FormsModule, MatInputModule, MatPaginatorModule, MatIcon, MatIconButton, ListingCardComponent],
  templateUrl: './listings.component.html',
  styleUrl: './listings.component.css',
  host: {
    '(window:resize)': 'onResize()'
  },
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListingsComponent implements OnInit {
  public userService = inject(UserService);
  public listingService = inject(ListingService);
  public dialog = inject(MatDialog);
  private router = inject(Router);
  private featureFlagService = inject(FeatureFlagService);
  private tourService = inject(TourService);

  listingsData = signal<Listing[]>([]);
  searchQuery = signal<string>('');
  totalPages = signal<number>(0);

  // Properties for filtering and sorting
  dateFilter = signal<string>('all');
  sortBy = signal<string>('date_desc');
  categoryFilter = signal<string>('all');
  categories = signal<string[]>([]);
  Math = Math; // Make Math available to the template

  isLoading = signal<boolean>(false);
  totalRows = signal<number>(0);
  pageSize = signal<number>(32);
  currentPage = signal<number>(1);
  experimentalFeaturesEnabled = signal<boolean>(false);

  constructor() {
    // Initialize experimental features state
    this.experimentalFeaturesEnabled.set(this.featureFlagService.getExperimentalFeaturesEnabled());
    this.featureFlagService.isExperimentalFeaturesEnabled().subscribe(enabled => {
      this.experimentalFeaturesEnabled.set(enabled);
    });
  }

  // Method to manually start the tour
  startTour(): void {
    this.tourService.startListingsTour();
  }

  ngOnInit(): void {
    this.loadData(); // This will update totalRows from the pagination response
    this.loadCategories();
  }

  // Add these navigation methods
  goToPreviousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadData();
    }
  }

  goToNextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
      this.loadData();
    }
  }

  navigateToListing(listingId: string): void {
    // Instead of navigating to the listing detail page, open the edit dialog
    this.editListing(listingId);
  }

  loadData() {
    this.isLoading.set(true);

    // Pass filters to the service
    this.listingService.getListings(
      this.pageSize(),
      this.currentPage(),
      this.searchQuery(),
      this.dateFilter(),
      this.sortBy()
    ).pipe(take(1)).subscribe({
      next: (paginatedListings) => {
        this.listingsData.set(paginatedListings.items);
        this.totalRows.set(paginatedListings.meta.totalItems);
        this.totalPages.set(paginatedListings.meta.totalPages);

        this.isLoading.set(false);
      },
      error: (error) => {
        console.error(error);
        this.isLoading.set(false);
      }
    });
  }

  loadCategories() {
    this.listingService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  /**
   * Apply all filters and reload data
   */
  applyFilters() {
    this.currentPage.set(1); // Reset to first page when filters change
    this.loadData();
  }

  onSearch(query: string) {
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset to first page when search changes
    this.loadData(); // This will update totalRows from the pagination response
  }

  /**
   * Listen for window resize events to update display
   */
  onResize() {
    // Measurement logic if needed
  }

  /**
   * Opens a dialog to create a new listing
   */
  createListing(listingData?: any, errorMessage?: string): void {
    const dialogRef = this.dialog.open(AddListingDialogComponent, {
      width: '600px',
      data: {
        listing: listingData,
        errorMessage: errorMessage,
        isEdit: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.listingService.create(result).subscribe({
          next: (newListing) => {
            // Refresh the listings data
            this.loadData();
          },
          error: (error) => {
            console.error('Error creating listing:', error);

            // If it's a conflict error (409), reopen the dialog with the error message
            if (error.status === 409) {
              this.createListing(
                result,
                'A listing with this date and description already exists for this user. Please change the date or description.'
              );
            }
          }
        });
      }
    });
  }

  /**
   * Opens a dialog to edit an existing listing
   */
  editListing(listingId: string, errorMessage?: string): void {
    // First, get the listing details
    this.listingService.getListing(listingId).subscribe({
      next: (listing) => {
        const dialogRef = this.dialog.open(AddListingDialogComponent, {
          width: '600px',
          data: {
            listing: listing,
            errorMessage: errorMessage,
            isEdit: true
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.listingService.update(result).subscribe({
              next: (updatedListing) => {
                // Refresh the listings data
                this.loadData();
              },
              error: (error) => {
                console.error('Error updating listing:', error);

                // If it's a conflict error (409), reopen the dialog with the error message
                if (error.status === 409) {
                  this.editListing(
                    listingId,
                    'A listing with this date and description already exists for this user. Please change the date or description.'
                  );
                }
              }
            });
          }
        });
      },
      error: (error) => {
        console.error('Error fetching listing details:', error);
      }
    });
  }

  /**
   * Deletes a listing after confirmation
   */
  deleteListing(listingId: string): void {
    if (confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      this.isLoading.set(true);
      this.listingService.delete(listingId).subscribe({
        next: () => {
          this.loadData();
        },
        error: (error) => {
          console.error('Error deleting listing:', error);
          this.isLoading.set(false);
          alert('Error deleting listing. It might be linked to existing sales.');
        }
      });
    }
  }
}
