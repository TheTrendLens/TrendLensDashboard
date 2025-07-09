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

  private importQueueSubject = new BehaviorSubject<ImportQueueItem[]>([]);
  public importQueue$ = this.importQueueSubject.asObservable();

  private activeImportsSubject = new BehaviorSubject<any[]>([]);
  public activeImports$ = this.activeImportsSubject.asObservable();

  private isProcessingQueue = false;

  constructor(private http: HttpClient, private readonly userService: UserService) {
    this.loadQueueFromStorage();
    this.processNextInQueue();
  }

  getImports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.endpoint}`).pipe(
      tap(imports => {
        const activeImports = imports.filter(importItem =>
          importItem.status === 'pending' || importItem.status === 'processing');
        if (activeImports.length > 0) {
          this.activeImportsSubject.next([
            ...this.activeImportsSubject.value,
            ...activeImports.filter(importItem =>
              !this.activeImportsSubject.value.some(activeImport => activeImport.id === importItem.id))
          ]);

          activeImports.forEach(importItem => {
            this.pollImportStatus(importItem.id);
          })
        }
      })
    )
  }

  getImport(id: string): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/${id}`);
  }

  deleteImport(id: string): Observable<any> {
    return this.http.delete<any>(`${this.endpoint}/${id}`);
  }

  getImportStatus(id: string): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/${id}/status`);
  }

  addToQueue(files: File[]): void {
    const queue = this.importQueueSubject.value;

    const newQueue = [
      ...queue,
      ...files.map(file => ({
        file,
        status: 'queued' as const,
        progress: 0
      }))
    ];

    this.importQueueSubject.next(newQueue);
    this.saveQueueToStorage();

    if (!this.isProcessingQueue) {
      this.processNextInQueue();
    }
  }

  removeFromQueue(index: number): void {
    const queue = this.importQueueSubject.value;
    const newQueue = [...queue.slice(0, index), ...queue.slice(index + 1)];
    this.importQueueSubject.next([...newQueue]);
    this.saveQueueToStorage();
  }

  clearQueue(): void {
    this.importQueueSubject.next([]);
    localStorage.removeItem('importQueue');
  }

  private processNextInQueue(): void {
    const queue = this.importQueueSubject.value;
    const nextItemIndex = queue.findIndex(item => item.status === 'queued');

    if (nextItemIndex === -1) {
      this.isProcessingQueue = false;
      return;
    }

    this.isProcessingQueue = true;

    queue[nextItemIndex].status = 'uploading';
    this.importQueueSubject.next([...queue]);
    this.saveQueueToStorage();

    const item = queue[nextItemIndex];

    this.uploadFile(item.file).subscribe({
      next: (response) => {
        queue[nextItemIndex].id = response.importId;
        queue[nextItemIndex].status = 'processing';
        this.importQueueSubject.next([...queue]);
        this.saveQueueToStorage();

        const activeImport = {
          id: response.importId,
          filename: item.file.name,
          status: response.status,
          progress: 0
        };
        this.activeImportsSubject.next([...this.activeImportsSubject.value, activeImport]);
        this.pollImportStatus(response.importId, nextItemIndex);
      },
      error: (error) => {
        queue[nextItemIndex].status = 'failed';
        queue[nextItemIndex].error = error.message || 'Upload failed';
        this.importQueueSubject.next([...queue]);
        this.saveQueueToStorage();

        this.processNextInQueue();
      }
    })
  }

  private uploadFile(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);

    const user = this.userService.getCurrentUser()!;
    formData.append('userId', user.id);

    return this.http.post<any>(`${environment.backend.baseURL}/api/csv-import/sales`, formData);
  }

  private pollImportStatus(importId: string, index?: number): void {
    const pollInterval = setInterval(() => {
      this.getImportStatus(importId).subscribe({
        next: (status) => {
          const activeImports = this.activeImportsSubject.value;
          const importIndex = activeImports.findIndex(activeImport => activeImport.id === importId);

          if (importIndex !== -1) {
            activeImports[importIndex] = {
              ...activeImports[importIndex],
              ...status
            }
            this.activeImportsSubject.next([...activeImports]);
          }

          if (index !== undefined) {
            const queue = this.importQueueSubject.value;
            if (index < queue.length) {
              queue[index].progress = status.progress;

              if (status.status === 'completed') {
                queue[index].status = 'completed';
                this.processNextInQueue();
                clearInterval(pollInterval);
              } else if (status.status === 'failed') {
                queue[index].status = 'failed';
                queue[index].error = status.error_message || 'Processing failed';
                this.processNextInQueue();
                clearInterval(pollInterval);
              }

              this.importQueueSubject.next([...queue]);
              this.saveQueueToStorage();
            }
          }

          if (status.status === 'completed' || status.status === 'failed') {
            setTimeout(() => {
              const currentActive = this.activeImportsSubject.value;
              const updatedActive = currentActive.filter(activeImport => activeImport.id !== importId);
              this.activeImportsSubject.next(updatedActive);
            }, 3000);

            clearInterval(pollInterval);
          }
        },
        error: (error) => {
          console.error('Error polling import status:', error);
          clearInterval(pollInterval);

          if (index !== undefined) {
            const queue = this.importQueueSubject.value;
            if (index < queue.length) {
              queue[index].status = 'failed';
              queue[index].error = error.message || 'Polling failed';
              this.importQueueSubject.next([...queue]);
              this.saveQueueToStorage();
            }
            this.processNextInQueue();
          }
        }
      });
    }, 1000);
  }

  private saveQueueToStorage(): void {
    const queueForStorage = this.importQueueSubject.value.map(item => ({
      id: item.id,
      fileName: item.file.name,
      fileSize: item.file.size,
      fileType: item.file.type,
      status: item.status,
      progress: item.progress,
      error: item.error
    }));

    localStorage.setItem('importQueue', JSON.stringify(queueForStorage));
  }

  private loadQueueFromStorage(): void {
    const storedQueue = localStorage.getItem('importQueue');
    if (!storedQueue) return;

    try {
      const parsedQueue = JSON.parse(storedQueue);

      const activeItems = parsedQueue.filter((item: { status: string; }) => item.status === 'pending' || item.status === 'processing');

      const restoredQueue = activeItems.map((item: { fileName: string; fileType: any; progress: any; }) => ({
        file: new File([], item.fileName, { type: item.fileType }),
        status: 'failed' as const,
        progress: item.progress,
        error: 'Upload interrupted by page refresh'
      }));

      if (restoredQueue.length > 0) {
        this.importQueueSubject.next(restoredQueue);
      }
    } catch (error) {
      console.error('Error loading import queue from storage:', error);
      localStorage.removeItem('importQueue');
    }
  }
}
