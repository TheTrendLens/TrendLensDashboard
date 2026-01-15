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
  private readonly STORAGE_KEY_CODE = 'currencyCode';
  private currencySubject = new BehaviorSubject<string>('£');
  private currencyCodeSubject = new BehaviorSubject<string>('GBP');
  public currency$ = this.currencySubject.asObservable();
  public currencyCode$ = this.currencyCodeSubject.asObservable();

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
    const storedCurrencyCode = localStorage.getItem(this.STORAGE_KEY_CODE);
    if (storedCurrency) {
      this.currencySubject.next(storedCurrency);
    }
    if (storedCurrencyCode) {
      this.currencyCodeSubject.next(storedCurrencyCode);
    }

    // Then try to get from user object using the UserService
    const currentUser = this.userService.getCurrentUser();
    if (currentUser) {
      if (currentUser.currencySymbol) {
        this.currencySubject.next(currentUser.currencySymbol);
        localStorage.setItem(this.STORAGE_KEY, currentUser.currencySymbol);
      }
      if (currentUser.currency) {
        this.currencyCodeSubject.next(currentUser.currency);
        localStorage.setItem(this.STORAGE_KEY_CODE, currentUser.currency);
      }
    }

    // Subscribe to user changes to keep currency in sync
    this.userService.currentUser$.subscribe(user => {
      if (user) {
        if (user.currencySymbol) {
          this.currencySubject.next(user.currencySymbol);
          localStorage.setItem(this.STORAGE_KEY, user.currencySymbol);
        }
        if (user.currency) {
          this.currencyCodeSubject.next(user.currency);
          localStorage.setItem(this.STORAGE_KEY_CODE, user.currency);
        }
      }
    });
  }

  public getCurrencyCode(): string {
    return this.currencyCodeSubject.getValue();
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
    localStorage.setItem(this.STORAGE_KEY_CODE, currencyOption.code);

    // Update the subjects
    this.currencySubject.next(currencyOption.symbol);
    this.currencyCodeSubject.next(currencyOption.code);

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
