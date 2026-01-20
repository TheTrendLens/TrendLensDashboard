import {Observable} from 'rxjs';
import {Injectable} from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';

export interface EbayConnectionStatus {
  connected: boolean;
  marketplaceUserId: string | null;
  lastSyncAt: string | null;
  valid?: boolean;
  expiresIn?: number;
  message?: string;
}

export interface SyncJob {
  id: string;
  platform: string;
  syncType: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  recordsProcessed: number;
  recordsFailed: number;
  errorMessage?: string;
}

const endpoint = `${environment.backend.baseURL}/api/ebay`;

@Injectable({
  providedIn: 'root'
})
export class EbayService {
  constructor(private http: HttpClient) { }

  /**
   * Gets the eBay connection status for a user
   */
  getConnectionStatus(userId: string): Observable<EbayConnectionStatus> {
    return this.http.get<EbayConnectionStatus>(`${endpoint}/status`);
  }

  /**
   * Initiates the eBay OAuth flow by redirecting to eBay authorization page
   */
  connectToEbay(userId: string): void {
    this.http.get<{ authUrl: string }>(`${endpoint}/authorise`).subscribe({
      next: (response) => {
        console.log(response.authUrl);
        window.location.href = response.authUrl;
      },
      error: (error) => {
        console.error('Error connecting to eBay:', error);
      }
    })

  }

  /**
   * Triggers a manual sync of eBay sales data
   */
  syncSales(userId: string, dateRange?: { start: Date; end: Date }): Observable<SyncJob> {
    const body: any = { syncType: 'sales' };

    if (dateRange) {
      body.dateFrom = dateRange.start.toISOString();
      body.dateTo = dateRange.end.toISOString();
    }

    return this.http.post<SyncJob>(`${endpoint}/sync`, body);
  }

  /**
   * Triggers a manual sync of eBay listings data
   */
  syncListings(userId: string): Observable<SyncJob> {
    return this.http.post<SyncJob>(`${endpoint}/sync-listings`, {});
  }

  /**
   * Disconnects eBay account
   */
  disconnect(userId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${endpoint}/disconnect`, {});
  }

  /**
   * Gets sync history for a user
   */
  getSyncHistory(userId: string): Observable<SyncJob[]> {
    return this.http.get<SyncJob[]>(`${endpoint}/sync-history`);
  }

  /**
   * Gets a specific sync job by ID
   */
  getSyncJob(jobId: string): Observable<SyncJob> {
    return this.http.get<SyncJob>(`${endpoint}/sync-job/${jobId}`);
  }
}
