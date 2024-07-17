import { Component } from '@angular/core';
import {SidenavService} from "./sidenav.service";
import {AuthService} from "../../services/auth.service";

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss']
})
export class SidenavComponent {
  constructor(public sidenavService: SidenavService, public authService: AuthService ) {}
}
