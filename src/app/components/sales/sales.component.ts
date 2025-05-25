import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {Sale} from "../../models/sale";
import {CellValueChangedEvent, ColDef, GridOptions, RowValueChangedEvent} from "ag-grid-community";
import {AuthService} from "../../services/auth.service";
import {UserService} from "../../services/user.service";
import {AgGridAngular} from "ag-grid-angular";
import {SaleService} from "../../services/sale.service";

@Component({
  selector: 'app-listings',
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css']
})
export class SalesComponent implements OnInit {
  // ========== Component Properties ==========
  salesData: Sale[] = [];
  @ViewChild('salesGrid') salesGrid!: AgGridAngular;

  // ========== Grid Configuration ==========
  private createEditableNumberColumn(headerName: string, field: string, tooltipFieldName: string): ColDef {
    return {
      headerName: headerName,
      field: field,
      editable: true,
      valueFormatter: params => this.currencyFormatter(params.data[field], '£'),
      filter: 'agNumberColumnFilter',
      filterParams: {
        suppressAndOrCondition: true,
        filterOptions: ['greaterThan'],
      },
      cellStyle: this.getCellStyle,
      tooltipValueGetter: params => this.getMissingValueTooltip(params, tooltipFieldName)
    };
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
    this.createEditableNumberColumn("Sold Price", "sold_price", "sold price"),
    {
      headerName: "Listed Date",
      field: "listing.date_listed",
      filter: 'agDateColumnFilter'
    },
    {
      headerName: "Date Sold",
      field: "date_sold",
      editable: true,
      filter: 'agDateColumnFilter',
      cellEditor: 'agDateCellEditor'
    },
    this.createEditableNumberColumn("Depop Fee", "platform_fee", "depop fees"),
    this.createEditableNumberColumn("Payment Fee", "payment_fee", "payment fees"),
    this.createEditableNumberColumn("Postage Cost", "postage_cost", "postage costs"),
    {
      headerName: "Size",
      field: "size",
      filter: 'agTextColumnFilter'
    },
    {
      headerName: "Shipping Status",
      field: "shipping_status",
      filter: 'agTextColumnFilter',
      editable: true
    },
  ];

  salesGridOptions: GridOptions = {
    columnDefs: this.salesColumnDefs,
    onRowValueChanged: (event) => this.handleRowValueChanged(event),
    onCellValueChanged: (event) => this.handleCellValueChanged(event)
  };

  // ========== Constructor & Lifecycle Methods ==========
  constructor(
    public authService: AuthService,
    private userService: UserService,
    private saleService: SaleService
  ) {}

  ngOnInit(): void {
    this.loadSalesData();
  }

  // ========== Data Loading Methods ==========
  private loadSalesData(): void {
    this.userService.getSales().subscribe({
      next: (data) => {
        this.salesData = data;
      },
      error: (err) => console.error('Error loading sales data:', err)
    });
  }

  // ========== Formatting Helpers ==========
  private itemNameFormatter(params: any): string {
    let splits: string[] = params.value.split('-');
    splits.reverse().pop();
    splits.reverse();
    splits = splits.map((split) => split.charAt(0).toUpperCase() + split.slice(1));
    return splits.join(' ');
  }

  private currencyFormatter(currency: number, sign: string): string {
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

  // ========== Cell Styling Helpers ==========
  private getCellStyle(params: any): any {
    const hasValue = params.value !== undefined && params.value !== null && params.value !== '';
    const isHovered = params.node.isHovered();

    if (!hasValue) {
      return {
        backgroundColor: isHovered ? 'light_red' : 'pink'
      };
    } else {
      return {
        backgroundColor: isHovered ? 'light_blue' : 'white'
      };
    }
  }

  private getMissingValueTooltip(params: any, fieldName: string): string | null {
    if (!params.value && params.value !== 0) {
      return `Please enter your ${fieldName} here`;
    }
    return null;
  }

  // ========== Event Handlers ==========
  private handleRowValueChanged(event: RowValueChangedEvent): void {
    const data = event.data;
    console.log("Row value changed: " + JSON.stringify(data));
    this.saleService.update(data.id, data).subscribe();
    event.api.refreshCells();
  }

  private handleCellValueChanged(event: CellValueChangedEvent): void {
    const data = event.data;
    console.log("Cell value changed: " + JSON.stringify(data));
    this.saleService.update(data.id, data).subscribe();
    event.api.refreshCells();
  }
}
