import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkMode = new BehaviorSubject<boolean>(false);

  constructor() {
    // Initialize from localStorage if available
    this.loadThemePreference();
  }

  /**
   * Load theme preference from localStorage
   */
  private loadThemePreference(): void {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      this.darkMode.next(savedTheme === 'true');
    }

    // Apply theme immediately
    this.applyTheme(this.darkMode.value);
  }

  /**
   * Get the current dark mode state as an observable
   */
  isDarkMode(): Observable<boolean> {
    return this.darkMode.asObservable();
  }

  /**
   * Get the current dark mode value
   */
  getCurrentTheme(): boolean {
    return this.darkMode.value;
  }

  /**
   * Toggle dark mode
   */
  toggleDarkMode(): void {
    const newValue = !this.darkMode.value;
    this.darkMode.next(newValue);
    localStorage.setItem('darkMode', newValue.toString());
    this.applyTheme(newValue);
  }

  /**
   * Set dark mode to a specific value
   */
  setDarkMode(isDark: boolean): void {
    this.darkMode.next(isDark);
    localStorage.setItem('darkMode', isDark.toString());
    this.applyTheme(isDark);
  }

  /**
   * Apply the theme to the document
   */
  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
