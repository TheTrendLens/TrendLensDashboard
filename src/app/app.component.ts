import {Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Observable} from 'rxjs';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import {Auth} from '@angular/fire/auth';
import {ThemeService} from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  auth = inject(Auth);
  user: Observable<firebase.User | null>;

  title = 'TrendlensFrontend';

  constructor(
    private afAuth: AngularFireAuth,
    private themeService: ThemeService
  ) {
    this.user = afAuth.authState;
    // Initialize theme service (this ensures the service is created and initialized)
  }
}
