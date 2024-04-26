import {Component, Inject, OnInit} from '@angular/core';
import {Listing} from "../../models/listing";
import {ColDef} from "ag-grid-community";
import {map} from "rxjs";
import {AuthService} from "@auth0/auth0-angular";
import {DOCUMENT} from "@angular/common";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";

@Component({
  selector: 'app-listings',
  templateUrl: './listings.component.html',
  styleUrls: ['./listings.component.css']
})
export class ListingsComponent implements OnInit {
  // Row Data: The data to be displayed.
  rowData: Listing[] = [];

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

  user$ = this.auth.user$;

  constructor(public auth: AuthService, @Inject(DOCUMENT) private doc: Document, private http: HttpClient) {

  }

  ngOnInit(): void {
    this.user$.subscribe((user) => {
      this.http.get<Listing[]>(environment.backend.baseURL + '/api/listings/' + user?.email).subscribe((data: Listing[]) => {
        this.rowData = data;
      })
    });
  }

}
