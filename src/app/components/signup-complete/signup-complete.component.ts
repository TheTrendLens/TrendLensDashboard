import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-signup-complete',
  imports: [],
  templateUrl: './signup-complete.component.html',
  styleUrl: './signup-complete.component.css'
})
export class SignupCompleteComponent implements OnInit {
  constructor(public authService: AuthService) {
  }

  ngOnInit(): void {
    this.authService.logout();
  }

}
