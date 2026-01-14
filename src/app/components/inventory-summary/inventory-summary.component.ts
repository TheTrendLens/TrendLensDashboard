import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CurrencyService } from '../../services/currency.service';
import { take } from 'rxjs';

interface InventorySummary {
  totalListings: number;
  totalStock: number;
  totalInventoryValue: number;
}

@Component({
  selector: 'app-inventory-summary',
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="bg-white rounded-lg shadow-md p-6 mt-6">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Inventory Overview</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p class="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Listings</p>
          <p class="mt-2 text-3xl font-bold text-gray-900">{{ summary()?.totalListings || 0 }}</p>
        </div>
        <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p class="text-sm font-medium text-gray-500 uppercase tracking-wider">Active Stock</p>
          <p class="mt-2 text-3xl font-bold text-gray-900">{{ summary()?.totalStock || 0 }} items</p>
        </div>
        <div class="p-4 bg-gray-50 rounded-lg border border-gray-100">
          <p class="text-sm font-medium text-gray-500 uppercase tracking-wider">Inventory Value</p>
          <p class="mt-2 text-3xl font-bold text-brand-600">{{ summary()?.totalInventoryValue || 0 | currency:getCurrencyCode():'symbol':'1.2-2' }}</p>
          <p class="text-[10px] text-gray-400 mt-1">Based on Item Cost</p>
        </div>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InventorySummaryComponent implements OnInit {
  private http = inject(HttpClient);
  private currencyService = inject(CurrencyService);

  summary = signal<InventorySummary | null>(null);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.isLoading.set(true);
    this.http.get<InventorySummary>(`${environment.backend.baseURL}/api/listings/summary`).pipe(take(1)).subscribe({
      next: (data) => {
        this.summary.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading inventory summary:', err);
        this.isLoading.set(false);
      }
    });
  }

  getCurrencyCode(): string {
    return this.currencyService.getCurrencyCode();
  }
}
