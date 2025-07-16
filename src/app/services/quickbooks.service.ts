import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const endpoint = `${environment.backend.baseURL}/api/quickbooks`;

@Injectable({
  providedIn: 'root'
})
export class QuickBooksService {
  constructor(private http: HttpClient) { }

  /**
   * Gets the QuickBooks connection status for a user
   * @param userId The user ID
   * @returns An Observable with the connection status
   */
  getConnectionStatus(userId: string): Observable<{ connected: boolean; companyId: string | null }> {
    return this.http.get<{ connected: boolean; companyId: string | null }>(`${endpoint}/status/${userId}`);
  }

  /**
   * Initiates the QuickBooks OAuth flow by redirecting to the QuickBooks authorization page
   * @param userId The user ID
   */
  connectToQuickBooks(userId: string): void {
    // Redirect to the QuickBooks authorization endpoint
    window.location.href = `${endpoint}/authorize/${userId}`;
  }

  /**
   * Syncs sales data to QuickBooks
   * @param userId The user ID
   * @param dateRange Optional date range for syncing
   * @returns An Observable with the sync result
   */
  syncSalesToQuickBooks(userId: string, dateRange?: { start: Date; end: Date }): Observable<any> {
    return this.http.post(`${endpoint}/sync-sales/${userId}`, dateRange || {});
  }

  /**
   * Syncs listings data to QuickBooks as inventory items
   * @param userId The user ID
   * @returns An Observable with the sync result
   */
  syncListingsToQuickBooks(userId: string): Observable<any> {
    return this.http.post(`${endpoint}/sync-listings/${userId}`, {});
  }
}
