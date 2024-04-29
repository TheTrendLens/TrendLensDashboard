import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { DOCUMENT } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular'; // AG Grid Component
import {ColDef, GridOptions, RowValueChangedEvent} from 'ag-grid-community';
import {Listing} from "../../models/listing";
import {map, Observable} from "rxjs"; // Column Definition Type Interface
import {SaleService} from "../../services/sale.service";
import {Sale} from "../../models/sale";
import {ListingService} from "../../services/listing.service";
import {MatDialog} from "@angular/material/dialog";
import {ListingModalComponent} from "../listing-table/listing-modal/listing-modal.component";
import {TrendAuthService} from "../../services/trend-auth.service";
import {
  StripeCardElementOptions,
  StripeElementsOptions,
} from '@stripe/stripe-js';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {Subscription} from "../../models/subscription";
import {StripeService} from "../../services/stripe.service";

const endpoint = `${environment.backend.baseURL}/api`

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  @ViewChild('salesGrid') grid!: AgGridAngular;
  // Row Data: The data to be displayed.
  rowData: Sale[] = [];
  listings: Listing[] = [];

  // Column Definitions: Defines the columns to be displayed.
  colDefs: ColDef[] = [
    { headerName: "ID", field: "id", filter: 'agTextColumnFilter', },
    { headerName: "Price", field: "price", editable: true, filter: 'agNumberColumnFilter' },
    { headerName: "Unit Cost", field: "item_cost", filter: 'agNumberColumnFilter' },
    { headerName: "Date Sold", field: "date_sold", editable: true, filter: 'agDateColumnFilter', cellEditor: 'agDateCellEditor' },
    { headerName: "Depop Fee", field: "platform_fee", editable: true, filter: 'agNumberColumnFilter' },
    { headerName: "Payment Fee", field: "payment_fee", editable: true, filter: 'agNumberColumnFilter' },
    { headerName: "Postage Cost", field: "postage_cost", editable: true, filter: 'agNumberColumnFilter' },
  ];

  gridOptions: GridOptions = {
    columnDefs: this.colDefs,
    editType: 'fullRow',
    onRowValueChanged: (event) => {
      this.onRowValueChanged(event);
    }
  }


  public chartOptions: any;
  public barChartOptions: any;

  user$ = this.auth.user$;
  code$ = this.user$.pipe(map((user) => JSON.stringify(user, null, 2)));
  subscription?: string;



  constructor(public auth: AuthService, @Inject(DOCUMENT) private doc: Document, private saleService: SaleService,
              private listingService: ListingService, private trendAuthService: TrendAuthService, private matDialogRef: MatDialog, private stripeService: StripeService) {
    this.chartOptions = {
      title: {
        text: "Sales by Month",
      },
      data: [
        { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162000 },
        { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302000 },
        { month: 'May', avgTemp: 16.2, iceCreamSales: 800000 },
        { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254000 },
        { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950000 },
        { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200000 },
      ],
      series: [
        {
          type: "area",
          xKey: "month",
          yKey: "iceCreamSales",
          yName: "iceCreamSales",
          stacked: true,
        },
        {
          type: "area",
          xKey: "month",
          yKey: "avgTemp",
          yName: "avgTemp",
          stacked: true,
        },
      ],
    };
    this.barChartOptions = {
      // Data: Data to be displayed in the chart
      data: [
        { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162000 },
        { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302000 },
        { month: 'May', avgTemp: 16.2, iceCreamSales: 800000 },
        { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254000 },
        { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950000 },
        { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200000 },
      ],
      // Series: Defines which chart type and data to use
      series: [{ type: 'bar', xKey: 'month', yKey: 'iceCreamSales' }]
    };
  }

  ngOnInit(): void {

    this.user$.subscribe({
      next: (user) => {
        if (user?.sub) {
          this.trendAuthService.login(user.sub).subscribe();
          this.saleService.findByUser(user.sub).subscribe({
            next: (data) => {
              this.rowData = data;
            },
            error: (err) => console.error(err)
          })
          this.listingService.findByUser(user.sub).subscribe({
            next: (data) => {
              this.listings = data;
              let oldDefs: any = this.grid.api.getColumnDefs();
              let colDef: ColDef = {
                headerName: "Item Name",
                  field: "name",
                editable: true,
                filter: 'agTextColumnFilter',
                cellEditor: 'agSelectCellEditor',
                cellEditorParams: {
                values: this.listings.map((listing) => listing.name)
                }
              }
              oldDefs?.push(colDef)
              this.grid.api.setColumnDefs(oldDefs);
              // @ts-ignore
              this.grid.api.moveColumnByIndex(oldDefs.length, 1)
            },
            error: (err) => console.error(err)
          })
          this.stripeService.getSubscriptionStatus(user.sub).subscribe( {
            next: (data) => {
              if (data.product)
                this.subscription = data.product
            }
          });
        }
      }
    });
  }

  onRowValueChanged(event: RowValueChangedEvent) {
    let data = event.data;
    console.log("onRowValueChanged: (" + JSON.stringify(data) + ")");
    this.saleService.update(data.id, data).subscribe();
  }

  login(): void {
    this.auth.loginWithRedirect();
  }

  logout(): void {
    this.auth.logout({
      logoutParams: {
        returnTo: this.doc.location.origin
      }
    });
  }

  openDialog() {
    this.matDialogRef.open(ListingModalComponent);
  }
}
