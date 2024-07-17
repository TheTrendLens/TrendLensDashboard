import {Component, Inject} from '@angular/core';
import {DOCUMENT} from "@angular/common";
import {AuthService} from "../../services/auth.service";

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})

export class AccountComponent {

  tiles = [
    {text: 'Tile 1', cols: 2, rows: 2 ,border: '3px double purple'},
    {text: 'Tile 2', cols: 2, rows: 2 ,border: '3px double red'},
  ];

  constructor(public auth: AuthService, @Inject(DOCUMENT) private doc: Document) {

  }
}
