import {Component, Inject} from '@angular/core';
import {AuthService} from "@auth0/auth0-angular";
import {DOCUMENT} from "@angular/common";
import {UserLinkFormComponent} from "./user-link-form/user-link-form.component";

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent {
  constructor(public auth: AuthService, @Inject(DOCUMENT) private doc: Document) {
  }

  login(): void {
    this.auth.loginWithRedirect();
  }

  logout(): void {
    this.auth.logout({
      logoutParams: {
        returnTo: this.doc.location.origin
      }
    });
  }
}
