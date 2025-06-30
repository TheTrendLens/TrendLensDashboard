import {Component} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {FormControl, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, ValidatorFn, FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {CommonModule} from '@angular/common';

// Custom validator to check if passwords match
export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  return password && confirmPassword && password.value !== confirmPassword.value
    ? { passwordMismatch: true }
    : null;
};

// Custom validator for password strength
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

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, passwordStrengthValidator]),
    confirmPassword: new FormControl('', [Validators.required])
  }, { validators: passwordMatchValidator });

  isLoading = false;
  errorMessage = '';

  constructor(public authService: AuthService, public router: Router) {
  }

  async onSubmit() {
    if (this.form.valid) {
      try {
        this.isLoading = true;
        this.errorMessage = '';
        await this.authService.signUpUsingEmailAndPassword(this.form.value.email!, this.form.value.password!);
      } catch (error: any) {
        this.errorMessage = error.message || 'Failed to sign up. Please try again.';
      } finally {
        this.isLoading = false;
      }
    }
  }

  async onGoogleSignup() {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      await this.authService.loginWithGoogle();
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to sign up with Google. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  // Helper methods for form validation
  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }
  get passwordsMatch() { return !this.form.hasError('passwordMismatch'); }
}
