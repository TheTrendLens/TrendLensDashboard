import {Component, CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {map, Observable} from 'rxjs';
import {AuthService} from '../../services/auth.service';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';
import {NgxStripeModule} from 'ngx-stripe';
import {CommonModule, NgIf} from '@angular/common';

@Component({
  selector: 'app-checkout',
  imports: [NgxStripeModule, NgIf, CommonModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class CheckoutComponent {
  customerSecret$!: Observable<Object>;
  stripeKey = process.env['STRIPE_KEY'];
  stripePricingTableId = process.env['STRIPE_PRICING_TABLE_ID'];
  isLoading = false;

  constructor(
    public authService: AuthService,
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.customerSecret$ = this.route.data.pipe(map(data => data['resolvedData'].client_secret))
  }

  async backToLogin() {
    try {
      this.isLoading = true;
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
