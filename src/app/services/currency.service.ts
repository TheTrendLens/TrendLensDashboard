import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { User } from '../models/user';

interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private readonly STORAGE_KEY = 'currency';
  private currencySubject = new BehaviorSubject<string>('£');
  public currency$ = this.currencySubject.asObservable();

  public readonly currencyOptions: CurrencyOption[] = [
    { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
    { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
    { code: 'EUR', symbol: '€', name: 'Euro (€)' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar (C$)' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar (A$)' }
  ];

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {
    this.initCurrency();
  }

  private initCurrency(): void {
    // First try to get from localStorage
    const storedCurrency = localStorage.getItem(this.STORAGE_KEY);
    if (storedCurrency) {
      this.currencySubject.next(storedCurrency);
    }

    // Then try to get from user object using the UserService
    const currentUser = this.userService.getCurrentUser();
    if (currentUser && currentUser.currencySymbol) {
      this.currencySubject.next(currentUser.currencySymbol);
      localStorage.setItem(this.STORAGE_KEY, currentUser.currencySymbol);
    }

    // Subscribe to user changes to keep currency in sync
    this.userService.currentUser$.subscribe(user => {
      if (user && user.currencySymbol) {
        this.currencySubject.next(user.currencySymbol);
        localStorage.setItem(this.STORAGE_KEY, user.currencySymbol);
      }
    });
  }

  public getCurrencyCode(): string {
    const symbol = this.getCurrencySymbol();
    const option = this.getCurrencyBySymbol(symbol);
    return option ? option.code : 'GBP';
  }

  public getCurrencySymbol(): string {
    return this.currencySubject.getValue();
  }

  public setCurrency(currencyCode: string): Observable<any> {
    const currencyOption = this.currencyOptions.find(option => option.code === currencyCode);

    if (!currencyOption) {
      throw new Error(`Invalid currency code: ${currencyCode}`);
    }

    // Update local storage
    localStorage.setItem(this.STORAGE_KEY, currencyOption.symbol);

    // Update the subject
    this.currencySubject.next(currencyOption.symbol);

    // Update the user in the database
    // The UserService.updateCurrency method will handle updating the BehaviorSubject and localStorage
    return this.userService.updateCurrency(currencyOption.code, currencyOption.symbol);
  }

  public getCurrencyBySymbol(symbol: string): CurrencyOption | undefined {
    return this.currencyOptions.find(option => option.symbol === symbol);
  }

  public getCurrencyByCode(code: string): CurrencyOption | undefined {
    return this.currencyOptions.find(option => option.code === code);
  }
}
