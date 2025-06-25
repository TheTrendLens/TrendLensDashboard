import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {MatButton} from "@angular/material/button";
import {
  MatCell,
  MatCellDef, MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatRow,
  MatRowDef, MatTable
} from "@angular/material/table";
import {MatFormField} from "@angular/material/form-field";
import {MatInput} from "@angular/material/input";
import {NgForOf, NgIf} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {Listing} from '../../models/listing';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {Sale} from '../../models/sale';
import {take} from 'rxjs';
import {UserService} from '../../services/user.service';
import {MatDialog} from '@angular/material/dialog';
import {AddListingDialogComponent} from '../add-listing-dialog/add-listing-dialog.component';
import {EditSaleDialogComponent} from '../edit-sale-dialog/edit-sale-dialog.component';
import {StatCardsComponent} from '../stat-cards/stat-cards.component';

const SALES_COLUMNS_SCHEMA = [
  {
    key: 'listing',
    nestedKey: 'slug',
    type: 'text',
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
    key: 'size',
    type: 'text',
    label: 'Size'
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
  selector: 'app-action-required-tables',
  imports: [
    MatButton,
    MatCell,
    MatCellDef,
    MatFormField,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatInput,
    MatRow,
    MatRowDef,
    MatTable,
    NgForOf,
    NgIf,
    ReactiveFormsModule,
    MatColumnDef,
    FormsModule,
    MatPaginator,
    MatHeaderCellDef
  ],
  templateUrl: './action-required-tables.component.html',
  styleUrl: './action-required-tables.component.css'
})
export class ActionRequiredTablesComponent implements OnInit {
  console = console;


  public salesData: Sale[] = [];
  salesDisplayedColumns: string[] = SALES_COLUMNS_SCHEMA.map((col) => col.nestedKey ? col.nestedKey : col.key);
  salesColumnsSchema: any = SALES_COLUMNS_SCHEMA;

  salesIsLoading: boolean = false;
  salesTotalRows = 250;
  salesPageSize = 5;
  salesCurrentPage = 0;
  @ViewChild(MatPaginator) salesPaginator!: MatPaginator;

  @Input('metricsComponent') metricsComponent: StatCardsComponent | undefined

  constructor(public userService: UserService, public dialog: MatDialog) {

  }

  ngOnInit(): void {
    this.loadData();
  }

  pageChanged(event: PageEvent) {
    this.salesPageSize = event.pageSize;
    this.salesCurrentPage = event.pageIndex;
    this.loadData();
  }

  loadData() {
    this.salesIsLoading = true;

    this.userService.getSalesWithMissingDataCount().pipe(take(1)).subscribe({
      next: (count) => {
        this.salesTotalRows = count;
      }
    })

    this.userService.getSalesWithMissingData(this.salesPageSize, this.salesCurrentPage + 1).pipe(take(1)).subscribe({
      next: (sales) => {
        this.salesData = sales;
        this.salesPaginator.pageIndex = this.salesCurrentPage;
        this.salesIsLoading = false;
      },
      error: (error) => {
        console.error(error);
        this.salesIsLoading = false;
      }
    })
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

      if (this.metricsComponent) {
        this.metricsComponent.updateStats();
      }
    })
  }
}
