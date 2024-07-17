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
  @ViewChild('salesGrid') grid!: AgGridAngular;
  @ViewChild('profitGraph') profitGraph!: AgCharts;
  // Row Data: The data to be displayed.
  rowData: Sale[] = [];
  listings: Listing[] = [];

  // Column Definitions: Defines the columns to be displayed.
  colDefs: ColDef[] = [
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

  gridOptions: GridOptions = {
    columnDefs: this.colDefs,
    onRowValueChanged: (event) => {
      this.onRowValueChanged(event);
    },
    onCellValueChanged: (event) => {
      this.onCellValueChanged(event);
    }
  }


  public options: any;

  subscription?: string;


  constructor(@Inject(DOCUMENT) private doc: Document, private saleService: SaleService,
              private listingService: ListingService, private authService: AuthService,
              private matDialogRef: MatDialog, private stripeService: StripeService,
              private userService: UserService) {

    this.options = {
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
  }

  ngOnInit(): void {
    this.getRecentSalesWithMissingData();

    this.getWeeklyProfit();
  }

  private getRecentSalesWithMissingData() {
    this.userService.getSalesWithMissingData().subscribe({
      next: (data) => {
        data.forEach((sale) => {
          sale.date_sold = new Date(Date.parse(sale.date_sold!.toString()));
          sale.listing.date_listed = new Date(Date.parse(sale.listing.date_listed!.toString()));
        })

        this.rowData = data;
      },
      error: (err) => console.error(err)
    });
  }

  updateCharts() {
  }

  getWeeklyProfit() {
    let today = new Date();
    for (let i = -6; i <= 0; i++) {
      let date = new Date();
      date.setDate(today.getDate() + i)
      this.userService.getProfitForDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getDate()).subscribe({
          next: ({date, profit}) => {
            let newDate = new Date(date);
            newDate.setMonth(newDate.getMonth() - 1);
            let dataPoint = {
              date: newDate,
              profit: profit
            };

            console.log(dataPoint);

            this.options.data?.push(dataPoint);
            this.options.data = this.options.data.sort((a: {date: Date, profit: number}, b: {date: Date, profit: number}) => {
              if (a.date < b.date)
                return -1
              else if (a.date > b.date)
                return 1;

              return 0;
            });
            console.log(this.options.data);
            this.profitGraph.chart?.update(this.options);
          },
          error: (err) => console.error(err)
        }
      )
    }
  }

  onRowValueChanged(event: RowValueChangedEvent) {
    let data = event.data;
    console.log("onRowValueChanged: (" + JSON.stringify(data) + ")");
    this.saleService.update(data.id, data).subscribe();
    event.api.refreshCells();
  }

  onCellValueChanged(event: CellValueChangedEvent) {
    let data = event.data;
    console.log("onCellValueChanged: (" + JSON.stringify(data) + ")");
    this.saleService.update(data.id, data).subscribe();
    event.api.refreshCells();
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
        const sansDec = currency.toFixed(2);
        const formatted = sansDec.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return sign + `${formatted}`;
    }

    return '£0.00';
  }
}
