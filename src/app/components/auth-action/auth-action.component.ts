import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { passwordStrengthValidator, passwordMatchValidator } from '../reset-password/reset-password.component';

@Component({
  selector: 'app-auth-action',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-action.component.html',
  styleUrl: './auth-action.component.css'
})
export class AuthActionComponent implements OnInit {
  mode: string | null = null;
  actionCode: string | null = null;
  email: string = '';

  // For password reset
  passwordForm = new FormGroup({
    password: new FormControl('', [Validators.required, passwordStrengthValidator]),
    confirmPassword: new FormControl('', [Validators.required])
  }, { validators: passwordMatchValidator });

  // States
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

    // Get the mode and action code from the URL
    this.mode = this.route.snapshot.queryParamMap.get('mode');
    this.actionCode = this.route.snapshot.queryParamMap.get('oobCode');

    if (!this.actionCode || !this.mode) {
      this.errorMessage = 'Invalid action link. Please request a new one.';
      this.isVerifying = false;
      return;
    }

    // Handle based on mode
    if (this.mode === 'resetPassword') {
      this.handlePasswordReset();
    } else if (this.mode === 'verifyEmail') {
      this.handleEmailVerification();
    } else {
      this.errorMessage = 'Invalid action mode.';
      this.isVerifying = false;
    }

    const ebayConnected = this.route.snapshot.queryParamMap.get('ebay_connected');
    const ebayError = this.route.snapshot.queryParamMap.get('ebay_error');

    if (ebayConnected === 'true') {
      // Show success message
      console.log('eBay connected successfully!');
      // Optionally show a toast/notification
      // this.notificationService.success('eBay account connected successfully!');

      // Redirect to account page (clean URL)
      this.router.navigate(['/account']);
    } else if (ebayError) {
      // Show error message
      console.error('eBay connection error:', ebayError);
      // Optionally show error toast
      // this.notificationService.error(`eBay connection failed: ${ebayError}`);

      // Redirect to account page
      this.router.navigate(['/account']);
    }
  }

  private handlePasswordReset() {
    // Verify the action code
    this.authService.verifyPasswordResetCode(this.actionCode!)
      .then(email => {
        this.email = email;
        this.isVerifying = false;
      })
      .catch(error => {
        this.errorMessage = 'Invalid or expired password reset link. Please request a new one.';
        this.isVerifying = false;
      });
  }

  private async handleEmailVerification() {
    try {
      // Verify the email
      await this.authService.applyActionCode(this.actionCode!);
      this.isSuccess = true;
      this.successMessage = 'Your email has been verified successfully. You can now log in.';
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to verify email. Please try again.';
    } finally {
      this.isVerifying = false;
    }
  }

  async resetPassword() {
    if (this.passwordForm.valid && this.actionCode) {
      try {
        this.isLoading = true;
        this.errorMessage = '';

        await this.authService.confirmPasswordReset(this.actionCode, this.passwordForm.value.password!);

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
  get password() { return this.passwordForm.get('password'); }
  get confirmPassword() { return this.passwordForm.get('confirmPassword'); }
  get passwordsMatch() { return !this.passwordForm.hasError('passwordMismatch'); }
}
