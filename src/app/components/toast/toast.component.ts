import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: string;
}

@Component({
  selector: 'app-toast',
  template: `
    <div
      class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
      role="region"
      aria-label="Notifications"
    >
      @for (toast of toasts(); track toast.id) {
        <div
          [class]="toastClasses(toast.type)"
          class="transform transition-all duration-300 ease-in-out animate-slide-in-right shadow-lg border-l-4 p-4 rounded-md flex items-start gap-3 min-w-80"
          role="alert"
          [attr.aria-live]="toast.type === 'error' ? 'assertive' : 'polite'"
        >
          <!-- Icon -->
          <div class="flex-shrink-0">
            @switch (toast.type) {
              @case ('success') {
                <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
              }
              @case ('error') {
                <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                </svg>
              }
              @case ('warning') {
                <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
              }
              @case ('info') {
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
                </svg>
              }
            }
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium" [class]="textClasses(toast.type)">
              {{ toast.message }}
            </p>
          </div>

          <!-- Action button -->
          @if (toast.action) {
            <button
              (click)="onAction.emit(toast.id)"
              [class]="actionClasses(toast.type)"
              class="text-sm font-medium hover:underline focus:outline-none focus:underline transition-colors"
            >
              {{ toast.action }}
            </button>
          }

          <!-- Close button -->
          <button
            (click)="onClose.emit(toast.id)"
            class="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-gray-500 dark:focus:ring-offset-gray-800 rounded"
            aria-label="Close notification"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class ToastComponent {
  toasts = input.required<Toast[]>();
  onClose = output<string>();
  onAction = output<string>();

  toastClasses(type: ToastType): string {
    const baseClasses = 'bg-white dark:bg-gray-800 border-l-4';

    switch (type) {
      case 'success':
        return `${baseClasses} border-l-green-500 bg-green-50 dark:bg-green-900/20`;
      case 'error':
        return `${baseClasses} border-l-red-500 bg-red-50 dark:bg-red-900/20`;
      case 'warning':
        return `${baseClasses} border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20`;
      case 'info':
        return `${baseClasses} border-l-blue-500 bg-blue-50 dark:bg-blue-900/20`;
      default:
        return baseClasses;
    }
  }

  textClasses(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'text-green-800 dark:text-green-200';
      case 'error':
        return 'text-red-800 dark:text-red-200';
      case 'warning':
        return 'text-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'text-blue-800 dark:text-blue-200';
      default:
        return 'text-gray-800 dark:text-gray-200';
    }
  }

  actionClasses(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200';
      case 'error':
        return 'text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200';
      case 'warning':
        return 'text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200';
      case 'info':
        return 'text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200';
      default:
        return 'text-gray-700 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-200';
    }
  }
}
