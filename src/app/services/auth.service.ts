import { Injectable } from '@angular/core';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import {Router} from '@angular/router';
import {
  Auth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  UserCredential,
  GoogleAuthProvider,
  signInWithEmailAndPassword, User, signOut, sendPasswordResetEmail, signInWithPopup,
  confirmPasswordReset, verifyPasswordResetCode, updatePassword, EmailAuthProvider, reauthenticateWithCredential
} from '@angular/fire/auth';
import {UserService} from './user.service';
import {User as DbUser} from '../models/user';
import {take} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly STORAGE_KEYS = {
    USER: 'user',
    DB_USER: 'dbUser'
  };

  constructor(
    public auth: Auth,
    private router: Router,
    private userService: UserService
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
  }

  private handleUserSignedOut(): void {
    localStorage.removeItem(this.STORAGE_KEYS.USER);
    localStorage.removeItem(this.STORAGE_KEYS.DB_USER);
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
        await this.createUserInDatabase(result.user.uid, result.user.email);
        await sendEmailVerification(result.user);
        this.router.navigate(['/signup/verify-email']);
      }
    } catch (error) {
      console.error('Sign up failed:', error);
      throw error;
    }
  }

  private async createUserInDatabase(uid: string, email: string): Promise<void> {
    try {
      const userData = await this.userService.create(uid, email).pipe(take(1)).toPromise();
      localStorage.setItem(this.STORAGE_KEYS.DB_USER, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to create user in database:', error);
      throw error;
    }
  }

  async loginWithEmailAndPassword(email: string, password: string): Promise<void> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      await this.fetchUserData();
      this.router.navigate(['home']);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async loginWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(this.auth, provider);
      await this.fetchUserData();
      this.router.navigate(['home']);
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

  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      // Configure action code settings with our custom reset password URL
      const actionCodeSettings = {
        url: window.location.origin + '/reset-password',
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

      await sendPasswordResetEmail(this.auth, email, actionCodeSettings);
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

  private async fetchUserDataIfNeeded(): Promise<void> {
    if (!localStorage.getItem(this.STORAGE_KEYS.DB_USER)) {
      await this.fetchUserData();
    }
  }

  private async fetchUserData(): Promise<void> {
    try {
      const userData = await this.userService.get().pipe(take(1)).toPromise();
      localStorage.setItem(this.STORAGE_KEYS.DB_USER, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      throw error;
    }
  }
}
