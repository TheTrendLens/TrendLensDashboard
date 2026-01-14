import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserAdminInfo {
  id: string;
  email: string;
  last_login_date: Date;
  signup_date: Date;
  active_package: string | null;
  database_usage: number; // in bytes
  is_missing_costs: boolean;
  is_missing_costs_this_month: boolean;
  sent_report: boolean;
}

export interface PaginatedUserAdminInfo {
  users: UserAdminInfo[];
  total: number;
  page: number;
  limit: number;
}

export interface QueuedJob {
  id: string;
  name: string;
  data: any;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'stalled';
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  stacktrace?: string[];
  progress: number;
  queue: string;
}

const endpoint = `${environment.backend.baseURL}/api/admin`;

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(private http: HttpClient) { }

  /**
   * Get application health status
   */
  getHealth(): Observable<any> {
    return this.http.get(`${environment.backend.baseURL}/health`);
  }

  /**
   * Get all queued jobs from all queues
   */
  getQueuedJobs(): Observable<QueuedJob[]> {
    return this.http.get<QueuedJob[]>(`${endpoint}/jobs`);
  }

  /**
   * Retry a failed/stalled job
   */
  retryJob(queueName: string, jobId: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${endpoint}/jobs/${queueName}/${jobId}/retry`, {});
  }

  /**
   * Remove a job from the queue
   */
  removeJob(queueName: string, jobId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${endpoint}/jobs/${queueName}/${jobId}`);
  }

  /**
   * Get all users with admin information with pagination
   * @param page The page number (1-based)
   * @param limit The number of users per page
   * @returns Observable of PaginatedUserAdminInfo
   */
  getAllUsers(page: number = 1, limit: number = 10): Observable<PaginatedUserAdminInfo> {
    return this.http.get<PaginatedUserAdminInfo>(`${endpoint}/users`, {
      params: { page: page.toString(), limit: limit.toString() }
    });
  }

  /**
   * Delete a user and all associated data
   * @param userId The user ID
   * @returns Observable of success message
   */
  deleteUser(userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${endpoint}/users/${userId}`);
  }

  /**
   * Format bytes to a human-readable format
   * @param bytes The number of bytes
   * @param decimals The number of decimal places
   * @returns Formatted string (e.g., "1.5 MB")
   */
  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * Upload a PDF report and send it to a user via email
   * @param userId The user ID
   * @param file The PDF file to upload
   * @returns Observable of success message
   */
  sendReportToUser(userId: string, file: File): Observable<{ message: string, filename: string, size: number }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<{ message: string, filename: string, size: number }>(
      `${endpoint}/users/${userId}/send-report`,
      formData
    );
  }
}
