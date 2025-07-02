import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserAdminInfo {
  id: string;
  email: string;
  last_login_date: Date | null;
  signup_date: Date;
  active_package: string | null;
  database_usage: number; // in bytes
}

const endpoint = `${environment.backend.baseURL}/api/admin`;

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(private http: HttpClient) { }

  /**
   * Get all users with admin information
   * @returns Observable of UserAdminInfo array
   */
  getAllUsers(): Observable<UserAdminInfo[]> {
    return this.http.get<UserAdminInfo[]>(`${endpoint}/users`);
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
}
