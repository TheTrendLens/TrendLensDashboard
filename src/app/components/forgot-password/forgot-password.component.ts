import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
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
    email: new FormControl('', [Validators.required, Validators.email])
  });

  isSubmitted = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit() {
    if (this.form.valid) {
      try {
        this.isLoading = true;
        this.errorMessage = '';
        await this.authService.sendPasswordResetEmail(this.form.value.email!);
        this.successMessage = 'Password reset email sent. Please check your inbox.';
        this.isSubmitted = true;
      } catch (error: any) {
        this.errorMessage = error.message || 'Failed to send reset email. Please try again.';
      } finally {
        this.isLoading = false;
      }
    }
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }

  // Helper methods for form validation
  get email() { return this.form.get('email'); }
}
