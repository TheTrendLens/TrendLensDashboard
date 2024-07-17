import {Component, OnInit} from '@angular/core';
import {AuthService} from "../../services/auth.service";
import * as boostrap from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent implements OnInit {

  constructor(public authService: AuthService) {

  }

  ngOnInit() {

  }

}
