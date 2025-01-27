import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SidenavComponent} from './components/sidenav/sidenav.component';
import {SidenavLinkComponent} from './components/sidenav-link/sidenav-link.component';
import {provideRouter, RouterModule, Routes} from "@angular/router";
import {HomeComponent} from './components/home/home.component';
import {AnalyticsComponent} from './components/analytics/analytics.component';
import {ListingsComponent} from './components/listings/listings.component';
import {AccountComponent} from './components/account/account.component';
import {HTTP_INTERCEPTORS, HttpClientModule, provideHttpClient} from "@angular/common/http";
import {AgGridModule} from "ag-grid-angular";
import {UserLinkFormComponent} from './components/account/user-link-form/user-link-form.component';
import {ReactiveFormsModule} from "@angular/forms";
import {AgChartsModule} from "ag-charts-angular";
import {MatDialogModule} from "@angular/material/dialog";
import {ListingModalComponent} from './components/listing-table/listing-modal/listing-modal.component';
import {environment} from "../environments/environment";
import {CheckoutComponent} from "./components/checkout/checkout.component";
import {CUSTOM_ELEMENTS_SCHEMA, inject, NgModule} from "@angular/core";
import {MatGridListModule} from "@angular/material/grid-list";

import {AngularFireModule} from "@angular/fire/compat";
import {AngularFireAuthModule} from "@angular/fire/compat/auth";
import {SignInComponent} from "./components/sign-in/sign-in.component";
import {AuthGuard} from "./utils/auth.guard";
import {JwtInterceptor} from "./utils/jwt-interceptor";
import {VerifyEmailComponent} from "./components/verify-email/verify-email.component";
import {ForgotPasswordComponent} from "./components/forgot-password/forgot-password.component";
import {SignUpComponent} from "./components/sign-up/sign-up.component";
import {NgbModule} from "@ng-bootstrap/ng-bootstrap";
import {StripeService} from "./services/stripe.service";
import {SubscriberGuard} from "./utils/subscriber.guard";
import {NoAuthGuard} from "./utils/no-auth.guard";
import {SalesComponent} from "./components/sales/sales.component";

const routes: Routes = [
  {path: '', component: HomeComponent, pathMatch: 'full', canActivate: [AuthGuard, SubscriberGuard]},
  {path: 'home', component: HomeComponent, canActivate: [AuthGuard, SubscriberGuard]},
  {path: 'sign-in', component: SignInComponent, canActivate: [NoAuthGuard]},
  {path: 'sign-up', component: SignUpComponent, canActivate: [NoAuthGuard]},
  {path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [NoAuthGuard]},
  {path: 'verify-email-address', component: VerifyEmailComponent, canActivate: [NoAuthGuard]},
  {path: 'sales', component: SalesComponent, canActivate: [AuthGuard, SubscriberGuard]},
  {path: 'analytics', component: AnalyticsComponent, canActivate: [AuthGuard, SubscriberGuard]},
  {path: 'listings', component: ListingsComponent, canActivate: [AuthGuard, SubscriberGuard]},
  {path: 'account', component: AccountComponent, canActivate: [AuthGuard, SubscriberGuard]},
  {
    path: 'checkout', component: CheckoutComponent, canActivate: [AuthGuard], resolve: {
      resolvedData: () =>
        inject(StripeService).createCustomerSession(JSON.parse(localStorage.getItem('user')!).uid)
    }
  },
  {path: '**', redirectTo: 'home'}
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
    SalesComponent,
    AccountComponent,
    HomeComponent,
    UserLinkFormComponent,
    ListingModalComponent,
    CheckoutComponent,
    SignInComponent,
    VerifyEmailComponent,
    ForgotPasswordComponent,
    SignUpComponent
  ],
  imports: [
    BrowserModule,
    NgbModule,
    BrowserAnimationsModule,
    RouterModule,
    RouterModule.forRoot(routes),
    AgGridModule,
    HttpClientModule,
    ReactiveFormsModule,
    AgChartsModule,
    MatDialogModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    MatGridListModule
  ],
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    {provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true}
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {
}
