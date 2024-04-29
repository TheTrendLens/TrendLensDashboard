import {Component, OnInit, ViewChild} from '@angular/core';
import {StripeCardComponent, StripeService} from "ngx-stripe";
import {RedirectToCheckoutOptions, StripeCardElementOptions, StripeElementsOptions} from "@stripe/stripe-js";
import {HttpClient} from "@angular/common/http";
import {switchMap} from "rxjs/operators";
import {environment} from "../../../environments/environment";
import {AuthService} from "@auth0/auth0-angular";
import {Observable} from "rxjs";

const endpoint = `${environment.backend.baseURL}/api`

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {

  customerSecret: Object = {};
  user$ = this.auth.user$;

  constructor(public auth: AuthService, private http: HttpClient, private stripeService: StripeService) {
  }

  ngOnInit(): void {
    this.user$.subscribe({
      next: (user) => {
        if (user?.sub) {
          this.http.post(`${endpoint}/create-stripe-customer-session`, { user_id: user.sub }).subscribe( {
            next: data => {
              this.customerSecret = data;
              console.log(this.customerSecret)
            }
          });
        }
      }
    });
  }

  checkout(priceId: string) {
    this.http.post(`${endpoint}/create-subscription`, { priceId }).pipe(
      switchMap((session) => {
        console.log(session)
        return this.stripeService.redirectToCheckout(<RedirectToCheckoutOptions>session)
      })
    ).subscribe(result => {
      if (result.error) {
        alert(result.error.message);
      }
    })
  }

  @ViewChild(StripeCardComponent) card!: StripeCardComponent;
  cardOptions: StripeCardElementOptions = {
    style: {
      base: {
        iconColor: '#666EE8',
        color: '#31325F',
        fontWeight: '300',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSize: '18px',
        '::placeholder': {
          color: '#CFD7E0',
        },
      },
    },
  };
  elementsOptions: StripeElementsOptions = {
    locale: 'en',
  };
}
