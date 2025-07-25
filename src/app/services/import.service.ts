import {environment} from '../../environments/environment';
import {Injectable} from '@angular/core';
import {BehaviorSubject, catchError, map, Observable, of, tap} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {UserService} from './user.service';

export interface ImportQueueItem {
  id?: string;
  file: File;
  status: 'queued' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

@Injectable({ providedIn: 'root'})
export class ImportService {
  private endpoint = `${environment.backend.baseURL}/api/imports`;

  constructor(private http: HttpClient, private readonly userService: UserService) {

  }

  getImports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.endpoint}`).pipe(
      tap(imports => {
        imports.filter(importItem =>
          importItem.status === 'pending' || importItem.status === 'processing');
      })
    )
  }

  /**
   * Initiates asynchronous deletion of an import
   * @param id The ID of the import to delete
   * @returns Observable with the response
   */
  initiateAsyncDelete(id: string): Observable<any> {
    return this.http.post<any>(`${this.endpoint}/${id}/delete`, {});
  }

  /**
   * Checks if any deletion is currently in progress
   * @returns Observable with the deletion status
   */
  getDeletionStatus(): Observable<{deletionInProgress: boolean}> {
    return this.http.get<{deletionInProgress: boolean}>(`${this.endpoint}/deletion-status`);
  }

  getImportStatus(id: string): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/${id}/status`);
  }

  private uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    const user = this.userService.getCurrentUser()!;
    formData.append('userId', user.id);

    return this.http.post<any>(`${environment.backend.baseURL}/api/csv-import/sales`, formData);
  }
}
