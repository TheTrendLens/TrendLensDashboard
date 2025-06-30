import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {Router} from '@angular/router';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './signup.component.css'
})
export class LoginComponent implements OnInit {
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    rememberMe: new FormControl(false)
  });

  isLoading = false;
  errorMessage = '';

  constructor(public authService: AuthService, public router: Router) {
  }

  ngOnInit() {
    // Check if we have stored credentials
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      this.form.patchValue({
        email: rememberedEmail,
        rememberMe: true
      });
    }
  }

  async onSubmit() {
    if (this.form.valid) {
      try {
        this.isLoading = true;
        this.errorMessage = '';

        // Handle remember me
        if (this.form.value.rememberMe) {
          localStorage.setItem('rememberedEmail', this.form.value.email!);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        await this.authService.loginWithEmailAndPassword(this.form.value.email!, this.form.value.password!);
      } catch (error: any) {
        this.errorMessage = error.message || 'Failed to login. Please check your credentials and try again.';
      } finally {
        this.isLoading = false;
      }
    }
  }

  async onGoogleButton() {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      await this.authService.loginWithGoogle();
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to login with Google. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  // Helper methods for form validation
  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }
}
