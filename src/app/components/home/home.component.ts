import {Component, Inject, OnInit} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {UserService} from '../../services/user.service';
import {StatCardsComponent} from '../stat-cards/stat-cards.component';
import {ActionRequiredTablesComponent} from '../action-required-tables/action-required-tables.component';
import {TourService} from '../../services/tour.service';

@Component({
  selector: 'app-home',
  imports: [StatCardsComponent, ActionRequiredTablesComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(
    @Inject(DOCUMENT) private doc: Document,
    private userService: UserService,
    private tourService: TourService
  ) {}

  ngOnInit(): void {
    // Component initialization logic
  }

  // Method to manually start the tour
  startTour(): void {
    this.tourService.startHomeTour();
  }
}
