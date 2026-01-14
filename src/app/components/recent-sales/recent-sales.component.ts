import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SalesService } from '../../services/sales.service';
import { CurrencyService } from '../../services/currency.service';
import { Sale } from '../../models/sale';
import { take } from 'rxjs';

@Component({
  selector: 'app-recent-sales',
  imports: [CommonModule, RouterModule, CurrencyPipe, DatePipe],
  template: `
    <div class="bg-white rounded-lg shadow-md overflow-hidden mt-6">
      <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 class="text-xl font-semibold text-gray-800">Recent Sales</h2>
        <a routerLink="/sales" class="text-brand-600 hover:text-brand-700 text-sm font-medium">View all sales →</a>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profit</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            @for (sale of recentSales(); track sale.id) {
              <tr class="hover:bg-gray-50 transition-colors cursor-pointer" [routerLink]="['/sales', sale.id]">
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ sale.date_sold | date:'mediumDate' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {{ sale.buyer || 'Unknown Buyer' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {{ sale.products.length }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {{ sale.total | currency:getCurrencyCode():'symbol':'1.2-2' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm" [class.text-green-600]="calculateProfit(sale) >= 0" [class.text-red-600]="calculateProfit(sale) < 0">
                  {{ calculateProfit(sale) | currency:getCurrencyCode():'symbol':'1.2-2' }}
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="px-6 py-10 text-center text-gray-500">
                  No sales found. Upload your first CSV to get started!
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecentSalesComponent implements OnInit {
  private salesService = inject(SalesService);
  private currencyService = inject(CurrencyService);

  recentSales = signal<Sale[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadRecentSales();
  }

  loadRecentSales(): void {
    this.isLoading.set(true);
    this.salesService.getSales(5, 1).pipe(take(1)).subscribe({
      next: (pagination) => {
        this.recentSales.set(pagination.items);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading recent sales:', err);
        this.isLoading.set(false);
      }
    });
  }

  getCurrencyCode(): string {
    return this.currencyService.getCurrencyCode();
  }

  calculateProfit(sale: Sale): number {
    const total = sale.total || 0;
    const fees = sale.total_fee || 0;
    const shipping = sale.seller_postage_cost || 0;
    const cogs = sale.products?.reduce((sum, p) => sum + (p.item_cost || 0), 0) || 0;
    return total - fees - shipping - cogs;
  }
}
