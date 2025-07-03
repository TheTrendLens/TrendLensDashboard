import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import {provideRouter, withDebugTracing} from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import {FIREBASE_OPTIONS} from '@angular/fire/compat';
import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {JwtInterceptor} from './utils/jwt-interceptor';
import {provideNgxStripe} from 'ngx-stripe';
import {provideNativeDateAdapter} from '@angular/material/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimationsAsync(),
    { provide: FIREBASE_OPTIONS, useValue: { projectId: "trendlens-dev", appId: "1:917406287028:web:a451a3e375d88fab2443e1", storageBucket: "trendlens-dev.firebasestorage.app", apiKey: "AIzaSyAe4OWrwydmxI6pYtI0FpJv_ZXxtXUZ1-4", authDomain: "trendlens-dev.firebaseapp.com", messagingSenderId: "917406287028", measurementId: "G-Y6JM26S7CY" } },
    provideFirebaseApp(() => initializeApp({ projectId: "trendlens-dev", appId: "1:917406287028:web:a451a3e375d88fab2443e1", storageBucket: "trendlens-dev.firebasestorage.app", apiKey: "AIzaSyAe4OWrwydmxI6pYtI0FpJv_ZXxtXUZ1-4", authDomain: "trendlens-dev.firebaseapp.com", messagingSenderId: "917406287028", measurementId: "G-Y6JM26S7CY" })), provideAuth(() => getAuth()),
    provideRouter(routes, withDebugTracing()),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true},
    provideNgxStripe(process.env['STRIPE_KEY']),
    provideNativeDateAdapter()
  ]
};
