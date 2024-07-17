import {Component, Inject, OnInit} from '@angular/core';
import {Listing} from "../../models/listing";
import {ColDef} from "ag-grid-community";
import {DOCUMENT} from "@angular/common";
import {ListingService} from "../../services/listing.service";
import {AuthService} from "../../services/auth.service";
import {UserService} from "../../services/user.service";

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

  constructor(public authService: AuthService, @Inject(DOCUMENT) private doc: Document, private userService: UserService) {

  }

  ngOnInit(): void {
    this.userService.getListings().subscribe({
      next: (data) => {
        data.forEach(listing => {
          let splits = listing.slug.split('-');
          splits.pop();
          splits[0] = '';
          let name = splits[1];
          splits[1] = '';
        })
        this.rowData = data;
      },
      error: (err) => console.error(err)
    });
  }

}
