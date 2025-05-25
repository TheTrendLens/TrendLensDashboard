import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {AgGridAngular} from 'ag-grid-angular'; // AG Grid Component
import {CellValueChangedEvent, ColDef, GridOptions, RowValueChangedEvent} from 'ag-grid-community';
import {Listing} from "../../models/listing";
// Column Definition Type Interface
import {SaleService} from "../../services/sale.service";
import {Sale} from "../../models/sale";
import {ListingService} from "../../services/listing.service";
import {MatDialog} from "@angular/material/dialog";
import {ListingModalComponent} from "../listing-table/listing-modal/listing-modal.component";
import {environment} from "../../../environments/environment";
import {StripeService} from "../../services/stripe.service";
import {AuthService} from "../../services/auth.service";
import {UserService} from "../../services/user.service";
import {AgCharts} from "ag-charts-angular";

const endpoint = `${environment.backend.baseURL}`

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  @ViewChild('salesGrid') salesGrid!: AgGridAngular;
  @ViewChild('listingsGrid') listingsGrid!: AgGridAngular;
  @ViewChild('profitGraph') profitGraph!: AgCharts;
  @ViewChild('salesGraph') salesGraph!: AgCharts;
  @ViewChild('costsGraph') costsGraph!: AgCharts;
  @ViewChild('revenueGraph') revenueGraph!: AgCharts;
  // Row Data: The data to be displayed.
  salesData: Sale[] = [];
  listingsData: Listing[] = [];
  listings: Listing[] = [];

  // Column Definitions: Defines the columns to be displayed.
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
  ];
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
  ];

  salesGridOptions: GridOptions = {
    columnDefs: this.salesColumnDefs,
    onRowValueChanged: (event) => {
      this.onSalesRowValueChanged(event);
    },
    onCellValueChanged: (event) => {
      this.onSalesCellValueChanged(event);
    }
  }

  listingsGridOptions: GridOptions = {
    columnDefs: this.listingsColumnDefs,
    onRowValueChanged: (event) => {
      this.onListingsRowValueChanged(event);
    },
    onCellValueChanged: (event) => {
      this.onListingsCellValueChanged(event);
    }
  }


  public profitGraphOptions: any = {
    theme: 'ag-material',
    title: {
      text: "Profit Week to Date",
    },
    series: [
      {
        type: "line",
        xKey: "date",
        yKey: "profit",
        yName: "Profit",
        marker: {
          enabled: true
        },
      }
    ],
    data: [],
    axes: [
      {
        type: "time",
        position: "bottom",
        label: {
          enabled: false
        },
        line: {
          enabled: false
        },
        gridLine: {
          enabled: false,
        },
      },
      {
        type: "number",
        position: "left",
        label: {
          enabled: false
        },
        gridLine: {
          enabled: false,
        },
      },
    ],
  };
  public salesGraphOptions: any = {
    theme: 'ag-material',
    title: {
      text: "Sales Week to Date",
    },
    series: [
      {
        type: "line",
        xKey: "date",
        yKey: "sales",
        yName: "Sales",
        marker: {
          enabled: true
        },
      }
    ],
    data: [],
    axes: [
      {
        type: "time",
        position: "bottom",
        label: {
          enabled: false
        },
        line: {
          enabled: false
        },
        gridLine: {
          enabled: false,
        },
      },
      {
        type: "number",
        position: "left",
        label: {
          enabled: false
        },
        gridLine: {
          enabled: false,
        },
      },
    ],
  };
  public revenueGraphOptions: any = {
    theme: 'ag-material',
    title: {
      text: "Revenue Week to Date",
    },
    series: [
      {
        type: "line",
        xKey: "date",
        yKey: "revenue",
        yName: "Revenue",
        marker: {
          enabled: true
        },
      }
    ],
    data: [],
    axes: [
      {
        type: "time",
        position: "bottom",
        label: {
          enabled: false
        },
        line: {
          enabled: false
        },
        gridLine: {
          enabled: false,
        },
      },
      {
        type: "number",
        position: "left",
        label: {
          enabled: false
        },
        gridLine: {
          enabled: false,
        },
      },
    ],
  };
  public costsGraphOptions: any = {
    theme: 'ag-material',
    title: {
      text: "Costs Week to Date",
    },
    series: [
      {
        type: "line",
        xKey: "date",
        yKey: "costs",
        yName: "Costs",
        marker: {
          enabled: true
        },
      }
    ],
    data: [],
    axes: [
      {
        type: "time",
        position: "bottom",
        label: {
          enabled: false
        },
        line: {
          enabled: false
        },
        gridLine: {
          enabled: false,
        },
      },
      {
        type: "number",
        position: "left",
        label: {
          enabled: false
        },
        gridLine: {
          enabled: false,
        },
      },
    ],
  };

  subscription?: string;

  statsData = [
    { title: 'Sales', value: '23' },
    { title: 'Sales', value: '23' },
    { title: 'Sales', value: '23' },
    { title: 'Sales', value: '23' },
    { title: 'Sales', value: '23' },
    { title: 'Sales', value: '23' },
  ];

  chartConfigs = [
    { options: this.profitGraphOptions },
    { options: this.salesGraphOptions },
    { options: this.costsGraphOptions },
    { options: this.revenueGraphOptions }
  ];

  constructor(@Inject(DOCUMENT) private doc: Document, private saleService: SaleService,
              private listingService: ListingService, private authService: AuthService,
              private matDialogRef: MatDialog, private stripeService: StripeService,
              private userService: UserService) {

  }

  ngOnInit(): void {
    this.updateCharts();

    this.getRecentSalesWithMissingData();
    this.getRecentListingsWithMissingData();
  }

  private updateCharts() {
    this.getYearlyProfit();
    this.getYearlyRevenue();
    this.getYearlyCosts();
    this.getYearlySalesCount();
  }

  private getRecentSalesWithMissingData() {
    this.userService.getSales(true).subscribe({
      next: (data) => {
        data.forEach((sale) => {
          sale.date_sold = new Date(Date.parse(sale.date_sold!.toString()));
          sale.listing.date_listed = new Date(Date.parse(sale.listing.date_listed!.toString()));
        })

        this.salesData = data;
      },
      error: (err) => console.error(err)
    });
  }

  private getRecentListingsWithMissingData() {
    this.userService.getListings(true).subscribe({
      next: (data) => {
        this.listingsData = data;
      },
      error: (err) => console.error(err)
    });
  }

  getYearlyProfit() {
    this.profitGraphOptions.data = new Array<any>();
    let today = new Date();
    for (let i = -11; i <= 0; i++) {
      let date = new Date();
      date.setDate(1);
      date.setMonth(today.getMonth() + i);
      this.userService.getStats('profit', date.getUTCFullYear(), date.getUTCMonth() + 1).subscribe({
          next: ({date, profit}) => {
            let newDate = new Date(date);
            newDate.setMonth(newDate.getMonth() - 1);
            let dataPoint = {
              date: newDate,
              profit: profit
            };

            this.profitGraphOptions.data?.push(dataPoint);
            this.profitGraphOptions.data = this.profitGraphOptions.data.sort((a: {date: Date, profit: number}, b: {date: Date, profit: number}) => {
              if (a.date < b.date)
                return -1
              else if (a.date > b.date)
                return 1;

              return 0;
            });
            this.profitGraph.chart?.update(this.profitGraphOptions);
          },
          error: (err) => console.error(err)
        }
      )
    }
  }

  getYearlyCosts() {
    this.costsGraphOptions.data = new Array<any>();
    let today = new Date();
    for (let i = -11; i <= 0; i++) {
      let date = new Date();
      date.setDate(1);
      date.setMonth(today.getMonth() + i);
      this.userService.getStats('costs', date.getUTCFullYear(), date.getUTCMonth() + 1).subscribe({
          next: ({date, costs}) => {
            let newDate = new Date(date);
            newDate.setMonth(newDate.getMonth() - 1);
            let dataPoint = {
              date: newDate,
              costs: costs
            };

            this.costsGraphOptions.data?.push(dataPoint);
            this.costsGraphOptions.data = this.costsGraphOptions.data.sort((a: {date: Date, costs: number}, b: {date: Date, costs: number}) => {
              if (a.date < b.date)
                return -1
              else if (a.date > b.date)
                return 1;

              return 0;
            });
            this.costsGraph.chart?.update(this.costsGraphOptions);
          },
          error: (err) => console.error(err)
        }
      )
    }
  }

  getYearlyRevenue() {
    this.revenueGraphOptions.data = new Array<any>();
    let today = new Date();
    for (let i = -11; i <= 0; i++) {
      let date = new Date();
      date.setDate(1);
      date.setMonth(today.getMonth() + i);
      this.userService.getStats('revenue', date.getUTCFullYear(), date.getUTCMonth() + 1).subscribe({
          next: ({date, revenue}) => {
            let newDate = new Date(date);
            newDate.setMonth(newDate.getMonth() - 1);
            let dataPoint = {
              date: newDate,
              revenue: revenue
            };

            this.revenueGraphOptions.data?.push(dataPoint);
            this.revenueGraphOptions.data = this.revenueGraphOptions.data.sort((a: {date: Date, revenue: number}, b: {date: Date, revenue: number}) => {
              if (a.date < b.date)
                return -1
              else if (a.date > b.date)
                return 1;

              return 0;
            });
            this.revenueGraph.chart?.update(this.revenueGraphOptions);
          },
          error: (err) => console.error(err)
        }
      )
    }
  }

  getYearlySalesCount() {
    this.salesGraphOptions.data = new Array<any>();
    let today = new Date();
    for (let i = -11; i <= 0; i++) {
      let date = new Date();
      date.setDate(1);
      date.setMonth(today.getMonth() + i);
      this.userService.getStats('sales', date.getUTCFullYear(), date.getUTCMonth() + 1).subscribe({
          next: ({date, sales}) => {
            let newDate = new Date(date);
            newDate.setMonth(newDate.getMonth() - 1);
            let dataPoint = {
              date: newDate,
              sales: sales
            };

            this.salesGraphOptions.data?.push(dataPoint);
            this.salesGraphOptions.data = this.salesGraphOptions.data.sort((a: {date: Date, sales: number}, b: {date: Date, sales: number}) => {
              if (a.date < b.date)
                return -1
              else if (a.date > b.date)
                return 1;

              return 0;
            });
            this.salesGraph.chart?.update(this.salesGraphOptions);
          },
          error: (err) => console.error(err)
        }
      )
    }
  }

  onSalesRowValueChanged(event: RowValueChangedEvent) {
    let data = event.data;
    console.log("onRowValueChanged: (" + JSON.stringify(data) + ")");
    this.saleService.update(data.id, data).subscribe();
    event.api.refreshCells();

    this.updateCharts();
  }

  onListingsRowValueChanged(event: RowValueChangedEvent) {
    let data = event.data;
    console.log("onRowValueChanged: (" + JSON.stringify(data) + ")");
    this.listingService.update(data.id, data).subscribe();
    event.api.refreshCells();

    this.updateCharts();
  }

  onSalesCellValueChanged(event: CellValueChangedEvent) {
    let data = event.data;
    console.log("onCellValueChanged: (" + JSON.stringify(data) + ")");
    this.saleService.update(data.id, data).subscribe();
    event.api.refreshCells();

    this.updateCharts();
  }

  onListingsCellValueChanged(event: CellValueChangedEvent) {
    let data = event.data;
    console.log("onCellValueChanged: (" + JSON.stringify(data) + ")");
    this.listingService.update(data.id, data).subscribe();
    event.api.refreshCells();

    this.updateCharts();
  }

  openDialog() {
    this.matDialogRef.open(ListingModalComponent);
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
}
