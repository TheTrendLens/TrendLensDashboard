import {Component, HostListener, OnInit} from '@angular/core';
import {UserService} from '../../services/user.service';
import {take} from 'rxjs';
import {MatTableModule} from '@angular/material/table';
import {NgForOf, NgIf} from '@angular/common';
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
  imports: [MatTableModule, NgForOf, FormsModule, MatInputModule, MatPaginatorModule, MatIcon, MatIconButton, ListingCardComponent, NgIf],
  templateUrl: './listings.component.html',
  styleUrl: './listings.component.css'
})
export class ListingsComponent implements OnInit {
  public listingsData: Listing[] = [];
  searchQuery: string = '';
  totalPages: number = 0;

  // Properties for filtering and sorting
  dateFilter: string = 'all';
  sortBy: string = 'date_desc';
  categoryFilter: string = 'all';
  categories: string[] = [];
  Math = Math; // Make Math available to the template

  isLoading: boolean = false;
  totalRows = 0;
  pageSize = 32;
  currentPage = 1;// Default value
  experimentalFeaturesEnabled: boolean = false;

  constructor(
    public userService: UserService,
    public listingService: ListingService,
    public dialog: MatDialog,
    private router: Router,
    private featureFlagService: FeatureFlagService,
    private tourService: TourService
  ) {
    // Initialize experimental features state
    this.experimentalFeaturesEnabled = this.featureFlagService.getExperimentalFeaturesEnabled();
    this.featureFlagService.isExperimentalFeaturesEnabled().subscribe(enabled => {
      this.experimentalFeaturesEnabled = enabled;
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
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadData();
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadData();
    }
  }

  navigateToListing(listingId: string): void {
    // Instead of navigating to the listing detail page, open the edit dialog
    this.editListing(listingId);
  }

  loadData() {
    this.isLoading = true;

    // Pass filters to the service
    this.listingService.getListings(
      this.pageSize,
      this.currentPage,
      this.searchQuery,
      this.dateFilter,
      this.sortBy
    ).pipe(take(1)).subscribe({
      next: (paginatedListings) => {
        this.listingsData = paginatedListings.items;
        this.totalRows = paginatedListings.meta.totalItems;
        this.totalPages = paginatedListings.meta.totalPages;

        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
      }
    });
  }

  loadCategories() {
    this.listingService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
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
    this.currentPage = 1; // Reset to first page when filters change
    this.loadData();
  }

  onSearch(query: string) {
    this.searchQuery = query;
    this.currentPage = 1; // Reset to first page when search changes
    this.loadData(); // This will update totalRows from the pagination response
  }

  /**
   * Listen for window resize events to update display
   */
  @HostListener('window:resize')
  onResize() {
    // Force change detection to update the display
    this.listingsData = [...this.listingsData];
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
}
