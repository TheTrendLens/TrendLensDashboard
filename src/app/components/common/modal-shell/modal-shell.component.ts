import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="open()"
      class="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="title() || 'Dialog'"
    >
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-gray-900/60 dark:bg-gray-900/80"
        (click)="onBackdropClick()"
      ></div>

      <!-- Panel -->
      <div
        class="relative z-50 w-full max-w-lg rounded-lg bg-white shadow-xl ring-1 ring-black/5 dark:bg-gray-800"
        [class.max-w-md]="size() === 'sm'"
        [class.max-w-lg]="size() === 'md'"
        [class.max-w-2xl]="size() === 'lg'"
      >
        <div class="flex items-start justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-base font-semibold text-gray-900 dark:text-gray-100">{{ title() }}</h2>
          <button
            type="button"
            (click)="close()"
            class="inline-flex items-center rounded-md px-2 py-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div class="px-5 py-4">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styleUrl: './modal-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'contents'
  }
})
export class ModalShellComponent {
  title = input<string>('');
  open = input.required<boolean>();
  size = input<'sm' | 'md' | 'lg'>('md');
  closeOnBackdrop = input<boolean>(true);

  closed = output<void>();

  private readonly _openSig = signal(false);

  constructor() {
    // Mirror input open to internal signal for potential extensions
    effect(() => {
      this._openSig.set(!!this.open());
    });
  }

  close() {
    this.closed.emit();
  }

  onBackdropClick() {
    if (this.closeOnBackdrop()) this.close();
  }
}
