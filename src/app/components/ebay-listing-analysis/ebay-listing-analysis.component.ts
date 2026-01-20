import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListingService, PaginatedListings } from '../../services/listing.service';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import {MatProgressSpinner} from '@angular/material/progress-spinner';

@Component({
  selector: 'app-ebay-listing-analysis',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    FormsModule,
    MatProgressSpinner
  ],
  templateUrl: './ebay-listing-analysis.component.html',
  styleUrls: ['./ebay-listing-analysis.component.css']
})
export class EbayListingAnalysisComponent implements OnInit {
  listings: any[] = [];
  totalItems = 0;
  pageSize = 10;
  currentPage = 1;
  searchQuery = '';
  sortBy = 'date_desc';
  isLoading = false;

  displayedColumns: string[] = ['slug', 'brand', 'category', 'listed_price', 'quantity', 'date_listed'];

  private searchSubject = new Subject<string>();

  constructor(private listingService: ListingService) {
    this.searchSubject.pipe(debounceTime(500)).subscribe(() => {
      this.loadListings();
    });
  }

  ngOnInit(): void {
    this.loadListings();
  }

  loadListings(): void {
    this.isLoading = true;
    this.listingService.getListings(this.pageSize, this.currentPage, this.searchQuery, '', this.sortBy)
      .subscribe({
        next: (response: PaginatedListings) => {
          this.listings = response.items.filter(item => item.source === 'eBay Inventory Import' || item.source?.includes('eBay'));
          this.totalItems = response.meta.totalItems;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading listings:', err);
          this.isLoading = false;
        }
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex + 1;
    this.loadListings();
  }

  onSortChange(sort: Sort): void {
    if (sort.direction === '') {
      this.sortBy = 'date_desc';
    } else {
      this.sortBy = `${sort.active}_${sort.direction}`;
    }
    this.loadListings();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.searchSubject.next(this.searchQuery);
  }
}
