import {Component} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {Router} from '@angular/router';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  form = new FormGroup({
    email: new FormControl(''),
    password: new FormControl('')
  });
  constructor(public authService: AuthService, public router: Router) {
  }

  async onSubmit() {
    if (this.form.value.email && this.form.value.password) {
      await this.authService.signUpUsingEmailAndPassword(this.form.value.email, this.form.value.password);
    }
  }
}
