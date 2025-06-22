import {Component, Inject} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {UserService} from '../../services/user.service';
import {StatCardsComponent} from '../stat-cards/stat-cards.component';
import {ActionRequiredTablesComponent} from '../action-required-tables/action-required-tables.component';

@Component({
  selector: 'app-home',
  imports: [StatCardsComponent, ActionRequiredTablesComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  constructor(@Inject(DOCUMENT) private doc: Document, private userService: UserService) {

  }


}
