import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {UserService} from '../../services/user.service';
import {take} from 'rxjs';
import {Listing} from '../../models/listing';
import {MatTableDataSource, MatTableModule} from '@angular/material/table';
import {NgForOf, NgIf, NgSwitch} from '@angular/common';
import {MatFormField, MatFormFieldModule} from '@angular/material/form-field';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatPaginator, MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {fakeAsync} from '@angular/core/testing';
import {MatDialog} from '@angular/material/dialog';
import {AddListingDialogComponent} from '../add-listing-dialog/add-listing-dialog.component';
import {MatButton} from '@angular/material/button';
import {TableSearchBarComponent} from '../table-search-bar/table-search-bar.component';


const COLUMNS_SCHEMA = [
  {
    key: 'id',
    type: 'number',
    label: 'ID'
  },
  {
    key: 'brand',
    type: 'text',
    label: 'Brand'
  },
  {
    key: 'category',
    type: 'text',
    label: 'Category'
  },
  {
    key: 'isEdit',
    type: 'isEdit',
    label: ''
  }
]

@Component({
  selector: 'app-listings',
  imports: [MatTableModule, NgForOf, FormsModule, MatInputModule, NgSwitch, NgIf, MatPaginatorModule, MatButton, TableSearchBarComponent],
  templateUrl: './listings.component.html',
  styleUrl: './listings.component.css'
})
export class ListingsComponent implements AfterViewInit, OnInit {
  public listingsData: Listing[] = [];
  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.key);
  columnsSchema: any = COLUMNS_SCHEMA;
  console = console;
  searchQuery: string = '';

  isLoading: boolean = false;
  totalRows = 250;
  pageSize = 100;
  currentPage = 0;
  pageSizeOptions: number[] = [5, 10, 25, 100];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(public userService: UserService, public dialog: MatDialog) {

  }

  ngOnInit(): void {
    this.loadData();
    this.userService.getListingsCount().pipe(take(1)).subscribe({
      next: (count) => {
        this.totalRows = count;
      }
    })
  }

  ngAfterViewInit(): void {
    // this.listingsData.paginator = this.paginator;
  }

  loadData() {
    this.isLoading = true;

    this.userService.searchListings(this.searchQuery, this.pageSize, this.currentPage + 1).pipe(take(1)).subscribe({
      next: (listings) => {
        this.listingsData = listings;
        this.paginator.pageIndex = this.currentPage;
        this.isLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.isLoading = false;
      }
    })
  }

  pageChanged(event: PageEvent) {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;
    this.loadData();
  }

  itemNameFormatter(params: any) {
    let splits: string[] = params.value.split('-');

    splits.reverse().pop();
    splits.reverse();

    splits = splits.map((split) => split.charAt(0).toUpperCase() + split.slice(1));

    return splits.join(' ');
  }

  currencyFormatter(currency: number, sign: string) {
    if (typeof currency !== "number") {
      currency = Number.parseInt(currency);
    }
    if (currency) {
      const sansDec = currency.toFixed(0);
      const formatted = sansDec.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return sign + `${formatted}`;
    }

    return '£0.00';
  }

  openAddListingDialog(): void {
    const dialogRef = this.dialog.open(AddListingDialogComponent, {
      width: '500px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log(result);
      }
    })
  }

  onSearch(query: string) {
    this.searchQuery = query;

    this.userService.getListingsCount(query).pipe(take(1)).subscribe({
      next: (count) => {
        this.totalRows = count;
      }
    })

    this.loadData();
  }
}
