import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {AuthService} from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  form = new FormGroup({
    email: new FormControl('')
  });

  isSubmitted = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit() {
    if (this.form.value.email) {
      try {
        this.errorMessage = '';
        await this.authService.sendPasswordResetEmail(this.form.value.email);
        this.isSubmitted = true;
      } catch (error: any) {
        this.errorMessage = error.message || 'Failed to send reset email. Please try again.';
      }
    }
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }
}
