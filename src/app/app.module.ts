import { NgModule } from '@angular/core';
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
import {HTTP_INTERCEPTORS, HttpClientModule, provideHttpClient, withInterceptors} from "@angular/common/http";
import {AuthGuard, AuthHttpInterceptor, authHttpInterceptorFn, AuthModule, provideAuth0} from "@auth0/auth0-angular";
import {AgGridModule} from "ag-grid-angular";
import { UserLinkFormComponent } from './components/account/user-link-form/user-link-form.component';
import {ReactiveFormsModule} from "@angular/forms";
import { FigureComponent } from './components/home/figure/figure.component';
import {AgChartsAngularModule} from "ag-charts-angular";

const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [AuthGuard]  },
  { path: 'analytics', component: AnalyticsComponent, canActivate: [AuthGuard]  },
  { path: 'listings', component: ListingsComponent, canActivate: [AuthGuard]  },
  { path: 'listing', component: ListingComponent, canActivate: [AuthGuard]  },
  { path: 'account', component: AccountComponent, canActivate: [AuthGuard] }
]

const config = {
  domain: 'trendlens.uk.auth0.com',
  clientId: '2XdQniwqeb0g3MPmnuv9w9BHbyprFXTn',
  authorizationParams: {
    redirect_uri: window.location.origin + '/dashboard',
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
    FigureComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    RouterModule,
    RouterModule.forRoot(routes),
    AgGridModule,
    HttpClientModule,
    ReactiveFormsModule,
    AgChartsAngularModule
  ],
  providers: [
    provideHttpClient(withInterceptors([authHttpInterceptorFn])),
    provideRouter(routes),
    provideAuth0(config)
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
