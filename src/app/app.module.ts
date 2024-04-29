import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SidenavComponent } from './components/sidenav/sidenav.component';
import { SidenavLinkComponent } from './components/sidenav-link/sidenav-link.component';
import {provideRouter, RouterModule, Routes} from "@angular/router";
import { HomeComponent } from './components/home/home.component';
import { AnalyticsComponent } from './components/analytics/analytics.component';
import { ListingsComponent } from './components/listings/listings.component';
import { ListingComponent } from './components/listing/listing.component';
import { AccountComponent } from './components/account/account.component';
import {HttpClientModule, provideHttpClient, withInterceptors} from "@angular/common/http";
import {AuthGuard, authHttpInterceptorFn, provideAuth0} from "@auth0/auth0-angular";
import {AgGridModule} from "ag-grid-angular";
import { UserLinkFormComponent } from './components/account/user-link-form/user-link-form.component';
import {ReactiveFormsModule} from "@angular/forms";
import { FigureComponent } from './components/home/figure/figure.component';
import {AgChartsAngularModule} from "ag-charts-angular";
import {MatDialogModule} from "@angular/material/dialog";
import { ListingModalComponent } from './components/listing-table/listing-modal/listing-modal.component';
import {NgxStripeModule} from "ngx-stripe";
import {environment} from "../environments/environment";
import {CheckoutComponent} from "./components/checkout/checkout.component";
import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from "@angular/core";
import {TestGuard} from "./utils/NoSubscriptionGuard";

const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard]  },
  { path: 'analytics', component: AnalyticsComponent, canActivate: [AuthGuard]  },
  { path: 'listings', component: ListingsComponent, canActivate: [AuthGuard]  },
  { path: 'listing', component: ListingComponent, canActivate: [AuthGuard]  },
  { path: 'account', component: AccountComponent, canActivate: [AuthGuard] },
  { path: 'checkout', component: CheckoutComponent, canActivate: [AuthGuard, TestGuard] }
]

const config = {
  domain: 'trendlens.uk.auth0.com',
  clientId: '2XdQniwqeb0g3MPmnuv9w9BHbyprFXTn',
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: 'https://www.trendlens.co.uk/api',
    scope: 'openid email profile',
  },
  httpInterceptor: {
    allowedList: ['*'],
  }
};

@NgModule({
  declarations: [
    AppComponent,
    SidenavComponent,
    SidenavLinkComponent,
    AnalyticsComponent,
    ListingsComponent,
    ListingComponent,
    AccountComponent,
    HomeComponent,
    UserLinkFormComponent,
    FigureComponent,
    ListingModalComponent,
    CheckoutComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    RouterModule.forRoot(routes),
    AgGridModule,
    HttpClientModule,
    ReactiveFormsModule,
    AgChartsAngularModule,
    MatDialogModule,
    NgxStripeModule.forRoot(environment.STRIPE_KEY)
  ],
  providers: [
    provideHttpClient(withInterceptors([authHttpInterceptorFn])),
    provideRouter(routes),
    provideAuth0(config)
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
