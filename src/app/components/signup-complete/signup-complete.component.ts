import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {RouterLink} from '@angular/router';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-signup-complete',
  imports: [
    RouterLink,
    CommonModule
  ],
  templateUrl: './signup-complete.component.html',
  styleUrl: './signup-complete.component.css'
})
export class SignupCompleteComponent implements OnInit {
  constructor(public authService: AuthService) {
  }

  ngOnInit(): void {
    // Log the user out for security reasons when they complete signup
    this.authService.logout();
  }
}
