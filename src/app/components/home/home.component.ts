import {Component, enableProdMode, Inject, OnInit} from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { AsyncPipe, DOCUMENT } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular'; // AG Grid Component
import { ColDef } from 'ag-grid-community';
import {HttpClient} from "@angular/common/http";
import {Listing} from "../../models/listing";
import {map} from "rxjs"; // Column Definition Type Interface
import { Auth0Lock } from 'auth0-lock';
import {environment} from "../../../environments/environment";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  // Row Data: The data to be displayed.
  rowData: Listing[] = [];

  // Column Definitions: Defines the columns to be displayed.
  colDefs: ColDef[] = [
    { headerName: "Item Name", field: "name", filter: 'agTextColumnFilter', },
    { headerName: "Listed Price", field: "listed_price", filter: 'agNumberColumnFilter' },
    { headerName: "Sold Price", field: "sold_price", filter: 'agNumberColumnFilter' },
    { headerName: "Sold", field: "sold" },
    { headerName: "Listed Date", field: "listed_date", filter: 'agDateColumnFilter', },
    { headerName: "Sold Date", field: "sold_date", editable: true, filter: 'agDateColumnFilter' },
    { headerName: "Depop Fee", field: "depop_fee", editable: true, filter: 'agNumberColumnFilter' },
    { headerName: "Payment Fee", field: "payments_fee", editable: true, filter: 'agNumberColumnFilter' },
    { headerName: "Postage Cost", field: "postage_fee", editable: true, filter: 'agNumberColumnFilter' },
    { headerName: "Item Cost", field: "item_cost", editable: true, filter: 'agNumberColumnFilter' },
  ];

  public chartOptions: any;
  public barChartOptions: any;

  user$ = this.auth.user$;
  code$ = this.user$.pipe(map((user) => JSON.stringify(user, null, 2)));
  user_metadata = '';

  constructor(public auth: AuthService, @Inject(DOCUMENT) private doc: Document, private http: HttpClient) {
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
    enableProdMode();
    this.user$.subscribe((user) => {
      this.http.get<Listing[]>(environment.backend.baseURL + '/api/sales/' + user?.email).subscribe((data: Listing[]) => {
        this.rowData = data;
      })
    });
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
}
