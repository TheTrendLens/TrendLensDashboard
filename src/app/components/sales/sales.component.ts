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
import {Sale} from '../../models/sale';
import {UploadCsvDialogComponent} from '../upload-csv-dialog/upload-csv-dialog.component';
import {EditSaleDialogComponent} from '../edit-sale-dialog/edit-sale-dialog.component';


const COLUMNS_SCHEMA = [
  {
    key: 'listing',
    nestedKey: 'slug',
    type: 'test',
    label: 'Listing'
  },
  {
    key: 'date_sold',
    type: 'text',
    label: 'Date Sold'
  },
  {
    key: 'listing',
    nestedKey: 'date_listed',
    type: 'text',
    label: 'Date Listed'
  },
  {
    key: 'listing',
    nestedKey: 'listed_price',
    type: 'number',
    label: 'Listed Price'
  },
  {
    key: 'sold_price',
    type: 'number',
    label: 'Sold Price'
  },
  {
    key: 'platform_fee',
    type: 'number',
    label: 'Platform Fee'
  },
  {
    key: 'payment_fee',
    type: 'number',
    label: 'Payment Fee'
  },
  {
    key: 'buyer_postage_cost',
    type: 'number',
    label: 'Postage Cost'
  },
  {
    key: 'item_cost',
    type: 'number',
    label: 'Item Cost'
  },
  {
    key: 'isEdit',
    type: 'isEdit',
    label: ''
  }
]

@Component({
  selector: 'app-sales',
  imports: [MatTableModule, NgForOf, FormsModule, MatInputModule, NgSwitch, NgIf, MatPaginatorModule, MatButton, TableSearchBarComponent],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.css'
})
export class SalesComponent implements AfterViewInit, OnInit {
  public salesData: Sale[] = [];
  displayedColumns: string[] = COLUMNS_SCHEMA.map((col) => col.nestedKey ? col.nestedKey : col.key);
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
    this.userService.getSalesCount().pipe(take(1)).subscribe({
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

    this.userService.searchSales(this.searchQuery, this.pageSize, this.currentPage + 1).pipe(take(1)).subscribe({
      next: (sales) => {
        this.salesData = sales;
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

  openUploadDialog(): void {
    const dialogRef = this.dialog.open(UploadCsvDialogComponent, {
      width: '2000px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.success) {
        // Handle successful upload
        console.log('Upload successful:', result.data);
      }
    });
  }


  onSearch(query: string) {
    this.searchQuery = query;

    this.userService.getSalesCount(query).pipe(take(1)).subscribe({
      next: (count) => {
        this.totalRows = count;
      }
    })

    this.loadData();
  }

  getValue(element: any, col: any): any {
    if (col.type === 'number') {
      return col.nestedKey ? element[col.key]?.[col.nestedKey]?.toFixed(2) : element[col.key]?.toFixed(2);
    } else {
      return col.nestedKey ? element[col.key]?.[col.nestedKey] : element[col.key];
    }
  }

  openEditSaleDialog(sale: Sale): void {
    const dialogRef = this.dialog.open(EditSaleDialogComponent, {
      width: '500px',
      data: sale
    });

    dialogRef.afterClosed().subscribe(result => {
      this.loadData();
    })
  }
}
