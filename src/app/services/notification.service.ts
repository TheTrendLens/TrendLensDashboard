import { Injectable, signal, computed } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { UserService } from './user.service';
import { environment } from '../../environments/environment';
import { Observable, Subject } from 'rxjs';
import { Toast, ToastType } from '../components/toast/toast.component';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private socket: Socket | undefined;
  private importStatusSubject = new Subject<any>();
  private toastsSignal = signal<Toast[]>([]);

  // Public readonly signal for components to subscribe to
  public toasts = this.toastsSignal.asReadonly();

  constructor(private userService: UserService) {}

  connect() {
    const user = this.userService.getCurrentUser()!;
    if (!user || (this.socket && this.socket.connected)) {
      return;
    }

    // Connect to the backend, passing the userId as a query parameter
    this.socket = io(`${environment.backend.baseURL}`, {
      query: { userId: user.id },
    });

    this.socket.on('connect', () => {
      console.log('Connected to notification server');
    });

    // Listen for the 'import-status' event from the server
    this.socket.on('import-status', (data) => {
      console.log('Notification received:', data);

      if (data.status === 'completed' || data.status === 'failed') {
        const type: ToastType = data.status === 'completed' ? 'success' : 'error';
        this.show(data.message, type, 10000);
      }
      this.importStatusSubject.next(data);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification server');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  onImportStatusChange(): Observable<any> {
    return this.importStatusSubject.asObservable();
  }

  /**
   * Show a toast notification
   */
  show(message: string, type: ToastType = 'info', duration: number = 5000, action?: string): string {
    const id = this.generateId();
    const toast: Toast = {
      id,
      message,
      type,
      duration,
      action
    };

    this.toastsSignal.update(toasts => [...toasts, toast]);

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }

    return id;
  }

  /**
   * Show success notification
   */
  success(message: string, duration: number = 5000, action?: string): string {
    return this.show(message, 'success', duration, action);
  }

  /**
   * Show error notification
   */
  error(message: string, duration: number = 10000, action?: string): string {
    return this.show(message, 'error', duration, action);
  }

  /**
   * Show warning notification
   */
  warning(message: string, duration: number = 7000, action?: string): string {
    return this.show(message, 'warning', duration, action);
  }

  /**
   * Show info notification
   */
  info(message: string, duration: number = 5000, action?: string): string {
    return this.show(message, 'info', duration, action);
  }

  /**
   * Remove a specific toast
   */
  remove(id: string): void {
    this.toastsSignal.update(toasts => toasts.filter(toast => toast.id !== id));
  }

  /**
   * Clear all toasts
   */
  clear(): void {
    this.toastsSignal.set([]);
  }

  /**
   * Generate unique ID for toasts
   */
  private generateId(): string {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
