import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UpgradeService {
  private readonly _isOpen = signal(false);
  private readonly _source = signal<string | null>(null);

  isOpen = this._isOpen.asReadonly();
  source = this._source.asReadonly();

  open(source?: string) {
    this._source.set(source ?? null);
    this._isOpen.set(true);
  }

  close() {
    this._isOpen.set(false);
    this._source.set(null);
  }
}
