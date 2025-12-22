import { Component, OnDestroy, OnInit } from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {Subscription} from 'rxjs';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-signup-flow',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './signup-flow.component.html',
  styleUrl: './signup-flow.component.css'
})
export class SignupFlowComponent implements OnInit, OnDestroy {
  steps = [
    { label: 'Login details', path: '/signup' },
    { label: 'Verify email', path: '/signup/verify-email' },
    { label: 'Choose package', path: '/signup/checkout' }
  ];

  currentIndex = 0;
  private sub?: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Set initial index
    this.currentIndex = this.getIndexFromUrl(this.router.url);
    // Update on navigation
    this.sub = this.router.events.subscribe(ev => {
      if (ev instanceof NavigationEnd) {
        this.currentIndex = this.getIndexFromUrl(ev.urlAfterRedirects || ev.url);
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private getIndexFromUrl(url: string): number {
    if (url.startsWith('/signup/verify-email')) return 1;
    if (url.startsWith('/signup/checkout')) return 2;
    // Hide progress on complete page by setting index to -1
    if (url.startsWith('/signup/complete')) return -1;
    return 0;
  }

  showProgress(): boolean {
    return this.currentIndex > -1;
  }
}
