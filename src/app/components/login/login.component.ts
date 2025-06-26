import {Component} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './signup.component.css'
})
export class LoginComponent {
  form = new FormGroup({
    email: new FormControl(''),
    password: new FormControl('')
  });
  constructor(public authService: AuthService, public router: Router) {
  }

  async onSubmit() {
    if (this.form.value.email && this.form.value.password) {
      await this.authService.loginWithEmailAndPassword(this.form.value.email, this.form.value.password);
    }
  }

  async onGoogleButton() {
    await this.authService.loginWithGoogle();
  }
}
