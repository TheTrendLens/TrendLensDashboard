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

    // Then try to get from user object
    const dbUserStr = localStorage.getItem('dbUser');
    if (dbUserStr) {
      try {
        const dbUser: User = JSON.parse(dbUserStr);
        if (dbUser && dbUser.currencySymbol) {
          this.currencySubject.next(dbUser.currencySymbol);
          localStorage.setItem(this.STORAGE_KEY, dbUser.currencySymbol);
        }
      } catch (e) {
        console.error('Error parsing dbUser from localStorage', e);
      }
    }
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

    const dbUserStr = localStorage.getItem('dbUser');
    if (dbUserStr) {
      try {
        const dbUser: User = JSON.parse(dbUserStr);
        if (dbUser) {
          dbUser.currency = currencyOption.code;
          dbUser.currencySymbol = currencyOption.symbol;
          localStorage.setItem('dbUser', JSON.stringify(dbUser));
        }
      } catch (e) {
        console.error('Error parsing dbUser from localStorage', e);
      }
    }

    // Update the user in the database
    return this.userService.updateCurrency(currencyOption.code, currencyOption.symbol);
  }

  public getCurrencyBySymbol(symbol: string): CurrencyOption | undefined {
    return this.currencyOptions.find(option => option.symbol === symbol);
  }

  public getCurrencyByCode(code: string): CurrencyOption | undefined {
    return this.currencyOptions.find(option => option.code === code);
  }
}
