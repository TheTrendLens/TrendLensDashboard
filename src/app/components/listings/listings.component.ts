import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {Listing} from "../../models/listing";
import {CellValueChangedEvent, ColDef, GridOptions, RowValueChangedEvent} from "ag-grid-community";
import {DOCUMENT} from "@angular/common";
import {ListingService} from "../../services/listing.service";
import {AuthService} from "../../services/auth.service";
import {UserService} from "../../services/user.service";
import {AgGridAngular} from "ag-grid-angular";

@Component({
  selector: 'app-listings',
  templateUrl: './listings.component.html',
  styleUrls: ['./listings.component.css']
})
export class ListingsComponent implements OnInit {
  // Row Data: The data to be displayed.
  listingsData: Listing[] = [];
  listings: Listing[] = [];
  @ViewChild('listingsGrid') listingsGrid!: AgGridAngular;

  // Column Definitions: Defines the columns to be displayed.
  colDefs: ColDef[] = [
    { headerName: "ID", field: "id", filter: 'agTextColumnFilter', },
    { headerName: "Name", field: "name", filter: 'agTextColumnFilter', },
    { headerName: "Price", field: "price", filter: 'agNumberColumnFilter' },
    { headerName: "Likes", field: "likes", filter: 'agNumberColumnFilter' },
    { headerName: "Bag Count", field: "bag_count", filter: 'agNumberColumnFilter' },
    { headerName: "Date Listed", field: "date_listed", filter: 'agDateColumnFilter', },
    { headerName: "Category", field: "category", editable: true, filter: 'agNumberColumnFilter' },
    { headerName: "Item Cost", field: "item_cost", editable: true, filter: 'agNumberColumnFilter' },
    { headerName: "Quantity", field: "quantity", editable: true, filter: 'agNumberColumnFilter' },
  ];

  constructor(public authService: AuthService, @Inject(DOCUMENT) private doc: Document, private userService: UserService, private listingService: ListingService) {

  }

  ngOnInit(): void {
    this.userService.getListings().subscribe({
      next: (data) => {
        this.listingsData = data;
      },
      error: (err) => console.error(err)
    });
  }


  listingsColumnDefs: ColDef[] = [
    {
      headerName: "Item Name",
      field: "slug",
      valueFormatter: this.itemNameFormatter,
      filter: 'agTextColumnFilter',
      filterParams: {
        valueFormatter: this.itemNameFormatter,
      },
    },
    {
      headerName: "Listed Price", field: "listed_price", editable: true,
      valueFormatter: params => this.currencyFormatter(params.data.listed_price, '£'),
      filter: 'agNumberColumnFilter',
      filterParams: {
        suppressAndOrCondition: true,
        filterOptions: ['greaterThan'],
      },
      cellStyle: params => {
        if (!params.value && params.value !== 0) {
          //mark police cells as red
          return {backgroundColor: 'pink'};
        } else {
          return {backgroundColor: 'white'}
        }
      },
      tooltipValueGetter: (params) => {
        if (!params.value && params.value !== 0) {
          return 'Please enter your listed price here'
        } else {
          return null;
        }
      }
    },
    {
      headerName: "Item Cost", field: "item_cost", editable: true,
      valueFormatter: params => this.currencyFormatter(params.data.item_cost, '£'),
      filter: 'agNumberColumnFilter',
      filterParams: {
        suppressAndOrCondition: true,
        filterOptions: ['greaterThan'],
      },
      cellStyle: params => {
        if (!params.value && params.value !== 0) {
          //mark police cells as red
          return {backgroundColor: 'pink'};
        } else {
          return {backgroundColor: 'white'}
        }
      },
      tooltipValueGetter: (params) => {
        if (!params.value && params.value !== 0) {
          return 'Please enter your item price here'
        } else {
          return null;
        }
      }
    },
    {headerName: "Listed Date", field: "date_listed", filter: 'agDateColumnFilter'},
    {headerName: "Brand", field: "brand", filter: 'agTextColumnFilter', editable: true},
    {headerName: "Category", field: "category", filter: 'agTextColumnFilter', editable: true},
    {headerName: "Status", field: "status", filter: 'agTextColumnFilter'},
    {headerName: "Like Count", field: "like_count", filter: 'agNumberColumnFilter'},
    {headerName: "Condition", field: "condition", filter: 'agTextColumnFilter', editable: true},
    {headerName: "Sold", field: "sold", filter: 'agTextColumnFilter', editable: true},
  ];

  listingsGridOptions: GridOptions = {
    columnDefs: this.listingsColumnDefs,
    onRowValueChanged: (event) => {
      this.onListingsRowValueChanged(event);
    },
    onCellValueChanged: (event) => {
      this.onListingsCellValueChanged(event);
    }
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

  onListingsRowValueChanged(event: RowValueChangedEvent) {
    let data = event.data;
    console.log("onRowValueChanged: (" + JSON.stringify(data) + ")");
    this.listingService.update(data.id, data).subscribe();
    event.api.refreshCells();
  }

  onListingsCellValueChanged(event: CellValueChangedEvent) {
    let data = event.data;
    console.log("onCellValueChanged: (" + JSON.stringify(data) + ")");
    this.listingService.update(data.id, data).subscribe();
    event.api.refreshCells();

  }

}
