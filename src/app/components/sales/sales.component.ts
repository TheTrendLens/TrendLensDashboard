import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {Listing} from "../../models/listing";
import {CellValueChangedEvent, ColDef, GridOptions, RowValueChangedEvent} from "ag-grid-community";
import {DOCUMENT} from "@angular/common";
import {ListingService} from "../../services/listing.service";
import {AuthService} from "../../services/auth.service";
import {UserService} from "../../services/user.service";
import {AgGridAngular} from "ag-grid-angular";
import {Sale} from "../../models/sale";
import {SaleService} from "../../services/sale.service";

@Component({
  selector: 'app-listings',
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css']
})
export class SalesComponent implements OnInit {
  // Row Data: The data to be displayed.
  salesData: Sale[] = [];
  @ViewChild('salesGrid') salesGrid!: AgGridAngular;

  constructor(public authService: AuthService, @Inject(DOCUMENT) private doc: Document, private userService: UserService, private saleService: SaleService) {

  }

  ngOnInit(): void {
    this.userService.getSales().subscribe({
      next: (data) => {
        this.salesData = data;
      },
      error: (err) => console.error(err)
    });
  }



  salesColumnDefs: ColDef[] = [
    {
      headerName: "Item Name",
      field: "listing.slug",
      valueFormatter: this.itemNameFormatter,
      filter: 'agTextColumnFilter',
      filterParams: {
        valueFormatter: this.itemNameFormatter,
      },
    },
    {
      headerName: "Sold Price", field: "sold_price", editable: true,
      valueFormatter: params => this.currencyFormatter(params.data.sold_price, '£'),
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
          return 'Please enter your sold price here'
        } else {
          return null;
        }
      }
    },
    {headerName: "Listed Date", field: "listing.date_listed", filter: 'agDateColumnFilter'},
    {
      headerName: "Date Sold",
      field: "date_sold",
      editable: true,
      filter: 'agDateColumnFilter',
      cellEditor: 'agDateCellEditor'
    },
    {
      headerName: "Depop Fee", field: "platform_fee", editable: true,
      valueFormatter: params => this.currencyFormatter(params.data.platform_fee, '£'),
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
          return 'Please enter your depop fees here'
        } else {
          return null;
        }
      }
    },
    {
      headerName: "Payment Fee", field: "payment_fee", editable: true,
      valueFormatter: params => this.currencyFormatter(params.data.payment_fee, '£'),
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
          return 'Please enter your payment fees here'
        } else {
          return null;
        }
      }
    },
    {
      headerName: "Postage Cost", field: "postage_cost", editable: true,
      valueFormatter: params => this.currencyFormatter(params.data.postage_cost, '£'),
      filter: 'agNumberColumnFilter',
      filterParams: {
        suppressAndOrCondition: true,
        filterOptions: ['greaterThan'],
      },
      cellStyle: params => {
        if (!params.value && params.value !== 0) {
          //mark police cells as red

          if (params.node.isHovered()) {
            return {
              backgroundColor: 'light_red'
            }
          } else {
            return {backgroundColor: 'pink'};
          }
        } else {

          if (params.node.isHovered()) {
            return {
              backgroundColor: 'light_blue'
            }
          } else {
            return {backgroundColor: 'white'};
          }
        }
      },
      tooltipValueGetter: (params) => {
        if (!params.value && params.value !== 0) {
          return 'Please enter your postage costs here'
        } else {
          return null;
        }
      }
    },
    {headerName: "Size", field: "size", filter: 'agTextColumnFilter'},
    // {headerName: "Offer", field: "offer", filter: 'agTextColumnFilter'},
    {headerName: "Shipping Status", field: "shipping_status", filter: 'agTextColumnFilter', editable: true},
  ];

  salesGridOptions: GridOptions = {
    columnDefs: this.salesColumnDefs,
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
    this.saleService.update(data.id, data).subscribe();
    event.api.refreshCells();
  }

  onListingsCellValueChanged(event: CellValueChangedEvent) {
    let data = event.data;
    console.log("onCellValueChanged: (" + JSON.stringify(data) + ")");
    this.saleService.update(data.id, data).subscribe();
    event.api.refreshCells();

  }

}
