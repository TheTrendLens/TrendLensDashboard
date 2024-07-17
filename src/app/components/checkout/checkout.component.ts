import {Component, OnInit, ViewChild} from '@angular/core';
import {RedirectToCheckoutOptions, StripeCardElementOptions, StripeElementsOptions} from "@stripe/stripe-js";
import {HttpClient} from "@angular/common/http";
import {switchMap} from "rxjs/operators";
import {environment} from "../../../environments/environment";
import {map, Observable} from "rxjs";
import {AuthService} from "../../services/auth.service";
import {ActivatedRoute} from "@angular/router";

const endpoint = `${environment.backend.baseURL}`

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent {

  customerSecret$!: Observable<Object>;

  constructor(public authService: AuthService, private http: HttpClient, private route: ActivatedRoute) {
    this.customerSecret$ = this.route.data.pipe(map(data => data['resolvedData'].client_secret))
  }
}
