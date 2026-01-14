import {Component, Inject, OnInit, inject, ChangeDetectionStrategy} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {UserService} from '../../services/user.service';
import {StatCardsComponent} from '../stat-cards/stat-cards.component';
import {ActionRequiredTablesComponent} from '../action-required-tables/action-required-tables.component';
import {TourService} from '../../services/tour.service';
import {QuickActionsComponent} from '../quick-actions/quick-actions.component';
import {RecentSalesComponent} from '../recent-sales/recent-sales.component';
import {InventorySummaryComponent} from '../inventory-summary/inventory-summary.component';

@Component({
  selector: 'app-home',
  imports: [StatCardsComponent, ActionRequiredTablesComponent, QuickActionsComponent, RecentSalesComponent, InventorySummaryComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  private doc = inject(DOCUMENT);
  private userService = inject(UserService);
  private tourService = inject(TourService);

  ngOnInit(): void {
    // Component initialization logic
  }

  // Method to manually start the tour
  startTour(): void {
    this.tourService.startHomeTour();
  }
}
