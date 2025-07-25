import { Injectable } from '@angular/core';
import {Router} from '@angular/router';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithEmailAndPassword, User, signOut, sendPasswordResetEmail, signInWithPopup,
  confirmPasswordReset, verifyPasswordResetCode, updatePassword, EmailAuthProvider, reauthenticateWithCredential,
  applyActionCode, ActionCodeSettings
} from '@angular/fire/auth';
import {UserService} from './user.service';
import {take, firstValueFrom} from 'rxjs';
import {NotificationService} from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEYS = {
    USER: 'user',
    DB_USER: 'dbUser' // Kept for backward compatibility
  };

  constructor(
    public auth: Auth,
    private router: Router,
    private userService: UserService,
    private notificationService: NotificationService
  ) {
    this.setupAuthStateListener();
  }

  private setupAuthStateListener(): void {
    this.auth.onAuthStateChanged((user) => {
      if (user) {
        this.handleUserSignedIn(user);
      } else {
        this.handleUserSignedOut();
      }
    });
  }

  private handleUserSignedIn(user: User): void {
    localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
    this.fetchUserDataIfNeeded();
    this.notificationService.connect();
  }

  private handleUserSignedOut(): void {
    this.notificationService.disconnect();
    localStorage.removeItem(this.STORAGE_KEYS.USER);
    // Use the UserService to clear user data
    this.userService.clearUserData();
  }

  get isAuthenticated(): boolean {
    return this.auth.currentUser !== null;
  }

  getSignedInUser(): User | null {
    return this.auth.currentUser;
  }

  async signUpUsingEmailAndPassword(email: string, password: string): Promise<void> {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      if (result.user && result.user.email) {
        // Don't create user in database yet - wait for email verification

        // Configure action code settings with our custom URL for email verification
        await sendEmailVerification(result.user);

        await this.router.navigate(['/signup/verify-email']);
      }
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    }
  }

  // Changed from private to public so it can be called after email verification
  public async createUserInDatabase(uid: string, email: string): Promise<void> {
    try {
      // UserService.create now handles updating the BehaviorSubject and localStorage
      await firstValueFrom(this.userService.create(uid, email).pipe(take(1)));
    } catch (error) {
      console.error('Failed to create user in database:', error);
      throw error;
    }
  }

  async loginWithEmailAndPassword(email: string, password: string): Promise<void> {
    try {
      // First authenticate with Firebase
      await signInWithEmailAndPassword(this.auth, email, password);

      try {
        // Then try to contact the backend
        await this.fetchUserData();
        // If both succeed, navigate to home
        this.router.navigate(['home']);
      } catch (backendError) {
        // If backend contact fails, sign out from Firebase and throw an error
        console.error('Backend contact failed:', backendError);
        await this.logout(); // Sign out from Firebase
        throw new Error('Login failed: Could not contact the backend. Please try again later.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      // First authenticate with Firebase
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(this.auth, provider);

      if (result && result.user && result.user.email) {
        try {
          // First try to fetch existing user data
          let user = await firstValueFrom(this.userService.get().pipe(take(1)));

          if (!user || !user.id || !user.email || user.email !== result.user.email) {
            await this.createUserInDatabase(result.user.uid, result.user.email);
          }
        } catch (error) {
          await this.createUserInDatabase(result.user.uid, result.user.email);
        }
      }

      try {
        // Then try to contact the backend
        await this.fetchUserData();
        // If both succeed, navigate to home
        this.router.navigate(['home']);
      } catch (backendError) {
        // If backend contact fails, sign out from Firebase and throw an error
        console.error('Backend contact failed:', backendError);
        await this.logout(); // Sign out from Firebase
        throw new Error('Login failed: Could not contact the backend. Please try again later.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      // Auth state listener will handle clearing localStorage
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  // Get action code settings for Firebase auth actions
  private getActionCodeSettings(mode: string): ActionCodeSettings {
    return {
      url: `${window.location.origin}/auth-action?mode=${mode}`,
      handleCodeInApp: true,
      // Setting iOS and Android bundle IDs to ensure consistent behavior across platforms
      iOS: {
        bundleId: 'com.trendlens.app'
      },
      android: {
        packageName: 'com.trendlens.app',
        installApp: true,
        minimumVersion: '12'
      },
      // This ensures the action code is passed directly to our app
      dynamicLinkDomain: window.location.hostname
    };
  }

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      // Configure action code settings with our custom URL for password reset
      const actionCodeSettings = this.getActionCodeSettings('resetPassword');

      await sendPasswordResetEmail(this.auth, email);
    } catch (error) {
      console.error('Password reset email failed:', error);
      throw error;
    }
  }

  async verifyPasswordResetCode(code: string): Promise<string> {
    try {
      return await verifyPasswordResetCode(this.auth, code);
    } catch (error) {
      console.error('Verify password reset code failed:', error);
      throw error;
    }
  }

  async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    try {
      await confirmPasswordReset(this.auth, code, newPassword);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user || !user.email) {
        throw new Error('No user is currently signed in or user has no email');
      }

      // Re-authenticate the user before changing password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Change the password
      await updatePassword(user, newPassword);
    } catch (error) {
      console.error('Change password failed:', error);
      throw error;
    }
  }

  async resendVerificationEmail(): Promise<void> {
    try {
      const user = this.auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      await sendEmailVerification(user);
    } catch (error) {
      console.error('Resending verification email failed:', error);
      throw error;
    }
  }

  async applyActionCode(code: string): Promise<void> {
    try {
      await applyActionCode(this.auth, code);
    } catch (error) {
      console.error('Apply action code failed:', error);
      throw error;
    }
  }

  private async fetchUserDataIfNeeded(): Promise<void> {
    // Check if we already have user data in the BehaviorSubject
    if (!this.userService.getCurrentUser()) {
      await this.fetchUserData();
    }
  }

  private async fetchUserData(): Promise<void> {
    try {
      // UserService.get now handles updating the BehaviorSubject and localStorage
      await firstValueFrom(this.userService.get().pipe(take(1)));
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      throw error;
    }
  }
}
