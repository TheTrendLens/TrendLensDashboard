import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

// Custom validator for password strength (reused from signup component)
export const passwordStrengthValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;

  if (!value) {
    return null;
  }

  const hasUpperCase = /[A-Z]+/.test(value);
  const hasLowerCase = /[a-z]+/.test(value);
  const hasNumeric = /[0-9]+/.test(value);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value);
  const minLength = value.length >= 8;

  const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && minLength;

  return !passwordValid ? { weakPassword: true } : null;
};

// Custom validator to check if passwords match
export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  return password && confirmPassword && password.value !== confirmPassword.value
    ? { passwordMismatch: true }
    : null;
};

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  form = new FormGroup({
    password: new FormControl('', [Validators.required, passwordStrengthValidator]),
    confirmPassword: new FormControl('', [Validators.required])
  }, { validators: passwordMatchValidator });

  actionCode: string | null = null;
  email: string = '';
  isLoading = false;
  isVerifying = false;
  isSuccess = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.isVerifying = true;
    this.actionCode = this.route.snapshot.queryParamMap.get('oobCode');

    if (!this.actionCode) {
      this.errorMessage = 'Invalid password reset link. Please request a new one.';
      this.isVerifying = false;
      return;
    }

    // Verify the action code
    this.authService.verifyPasswordResetCode(this.actionCode)
      .then(email => {
        this.email = email;
        this.isVerifying = false;
      })
      .catch(error => {
        this.errorMessage = 'Invalid or expired password reset link. Please request a new one.';
        this.isVerifying = false;
      });
  }

  async onSubmit() {
    if (this.form.valid && this.actionCode) {
      try {
        this.isLoading = true;
        this.errorMessage = '';

        await this.authService.confirmPasswordReset(this.actionCode, this.form.value.password!);

        this.isSuccess = true;
        this.successMessage = 'Your password has been reset successfully. You can now log in with your new password.';
      } catch (error: any) {
        this.errorMessage = error.message || 'Failed to reset password. Please try again.';
      } finally {
        this.isLoading = false;
      }
    }
  }

  backToLogin() {
    this.router.navigate(['/login']);
  }

  // Helper methods for form validation
  get password() { return this.form.get('password'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }
  get passwordsMatch() { return !this.form.hasError('passwordMismatch'); }
}
