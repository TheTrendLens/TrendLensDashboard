import {Component, Inject, OnInit} from '@angular/core';
import {DOCUMENT} from "@angular/common";
import {AuthService} from "../../services/auth.service";
import {CurrencyDropDown} from "../../models/CurrencyDropDown";
import {FormControl, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})

export class AccountComponent implements OnInit {

  CurrencyList: string[] = [
    'GBP',
    'USD',
    'EUR'
  ]

  MonthList: string[] = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]
  myForm: FormGroup = new FormGroup<any>({});

  constructor(public auth: AuthService, @Inject(DOCUMENT) private doc: Document) {

  }

  ngOnInit() {
    this.myForm = new FormGroup({
      currencySelector: new FormControl('GBP', Validators.required),
      endTaxDate: new FormControl('GBP', Validators.required),
    });
  }
}
