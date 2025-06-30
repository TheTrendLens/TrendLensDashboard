import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChangePasswordComponent } from '../change-password/change-password.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, ChangePasswordComponent],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css'
})
export class AccountComponent {
  userEmail: string = '';

  constructor(private authService: AuthService) {
    const user = this.authService.getSignedInUser();
    if (user && user.email) {
      this.userEmail = user.email;
    }
  }
}
