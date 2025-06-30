import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
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
  const password = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');

  return password && confirmPassword && password.value !== confirmPassword.value
    ? { passwordMismatch: true }
    : null;
};

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent {
  form = new FormGroup({
    currentPassword: new FormControl('', [Validators.required]),
    newPassword: new FormControl('', [Validators.required, passwordStrengthValidator]),
    confirmPassword: new FormControl('', [Validators.required])
  }, { validators: passwordMatchValidator });

  isLoading = false;
  isSuccess = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService) {}

  async onSubmit() {
    if (this.form.valid) {
      try {
        this.isLoading = true;
        this.errorMessage = '';
        this.successMessage = '';

        await this.authService.changePassword(
          this.form.value.currentPassword!,
          this.form.value.newPassword!
        );

        this.isSuccess = true;
        this.successMessage = 'Your password has been changed successfully.';
        this.form.reset();
      } catch (error: any) {
        this.errorMessage = error.message || 'Failed to change password. Please check your current password and try again.';
      } finally {
        this.isLoading = false;
      }
    }
  }

  // Helper methods for form validation
  get currentPassword() { return this.form.get('currentPassword'); }
  get newPassword() { return this.form.get('newPassword'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }
  get passwordsMatch() { return !this.form.hasError('passwordMismatch'); }
}
