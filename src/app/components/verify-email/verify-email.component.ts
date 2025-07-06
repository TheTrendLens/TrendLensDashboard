import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { interval } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';

@Component({
  selector: 'app-verify-email',
  imports: [
    CommonModule
  ],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent implements OnInit {
  isLoading = false;
  isResending = false;
  isChecking = false;
  errorMessage = '';
  successMessage = '';
  userEmail = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    const user = this.authService.getSignedInUser();
    if (user) {
      this.userEmail = user.email || '';

      // If the user's email is already verified, create user in database and redirect to checkout
      if (user.emailVerified) {
        if (user.email) {
          try {
            await this.authService.createUserInDatabase(user.uid, user.email);
          } catch (error: any) {
            // If the error is because the user already exists, we can continue
            // Otherwise, show an error message
            if (!error.message.includes('already exists')) {
              this.errorMessage = 'Failed to create your account. Please try again.';
              console.error('Failed to create user in database:', error);
              return;
            }
          }
        }
        this.router.navigate(['/signup/checkout']);
      } else {
        // Start polling to check email verification status
        this.startVerificationCheck();
      }
    }
  }

  startVerificationCheck() {
    this.isChecking = true;

    // Check every 5 seconds if the email has been verified
    interval(5000)
      .pipe(
        switchMap(() => {
          return new Promise<boolean>((resolve) => {
            const user = this.authService.getSignedInUser();
            if (user) {
              // Force refresh the token to get the latest email verification status
              user.reload()
                .then(() => {
                  resolve(user.emailVerified);
                })
                .catch(() => {
                  resolve(false);
                });
            } else {
              resolve(false);
            }
          });
        }),
        // Continue until email is verified or component is destroyed
        takeWhile(isVerified => !isVerified, true)
      )
      .subscribe(async (isVerified) => {
        if (isVerified) {
          this.isChecking = false;
          this.successMessage = 'Your email has been verified!';

          // Create user in database now that email is verified
          const user = this.authService.getSignedInUser();
          if (user && user.email) {
            try {
              // Call the createUserInDatabase method from AuthService
              await this.authService.createUserInDatabase(user.uid, user.email);

              // Redirect to checkout after a short delay
              setTimeout(() => {
                this.router.navigate(['/signup/checkout']);
              }, 1500);
            } catch (error: any) {
              this.errorMessage = 'Failed to create your account. Please try again.';
              console.error('Failed to create user in database:', error);
            }
          } else {
            this.errorMessage = 'User information is missing. Please try again.';
          }
        }
      });
  }

  async resendVerificationEmail() {
    try {
      this.isResending = true;
      this.errorMessage = '';
      this.successMessage = '';

      const user = this.authService.getSignedInUser();
      if (user) {
        await this.authService.resendVerificationEmail();
        this.successMessage = 'Verification email has been resent. Please check your inbox.';
      } else {
        this.errorMessage = 'You must be logged in to resend the verification email.';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to resend verification email. Please try again.';
    } finally {
      this.isResending = false;
    }
  }

  async continueToCheckout() {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      const user = this.authService.getSignedInUser();
      if (user) {
        // Force refresh the token to get the latest email verification status
        await user.reload();

        if (user.emailVerified) {
          // Create user in database if email is verified but user hasn't been created yet
          if (user.email) {
            try {
              await this.authService.createUserInDatabase(user.uid, user.email);
            } catch (error: any) {
              // If the error is because the user already exists, we can continue
              // Otherwise, show an error message
              if (!error.message.includes('already exists')) {
                this.errorMessage = 'Failed to create your account. Please try again.';
                console.error('Failed to create user in database:', error);
                this.isLoading = false;
                return;
              }
            }
          }

          this.router.navigate(['/signup/checkout']);
        } else {
          this.errorMessage = 'Your email has not been verified yet. Please check your inbox and click the verification link.';
        }
      } else {
        this.errorMessage = 'You must be logged in to continue.';
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'An error occurred. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  async backToSignup() {
    try {
      this.isLoading = true;
      this.errorMessage = '';

      // Log the user out first
      await this.authService.logout();

      // Navigate back to the signup page
      this.router.navigate(['/signup']);
    } catch (error: any) {
      this.errorMessage = error.message || 'An error occurred. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }
}
