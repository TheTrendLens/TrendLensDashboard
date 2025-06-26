import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-signup-complete',
  imports: [
    RouterLink
  ],
  templateUrl: './signup-complete.component.html',
  styleUrl: './signup-complete.component.css'
})
export class SignupCompleteComponent implements OnInit {

  #loginButton: HTMLButtonElement | null = null;

  constructor(public authService: AuthService) {
  }

  ngOnInit(): void {
    this.authService.logout();
  }

}
