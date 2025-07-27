import {Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Observable} from 'rxjs';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import {Auth} from '@angular/fire/auth';
import {ThemeService} from './services/theme.service';
import {NotificationService} from './services/notification.service';
import {ToastComponent} from './components/toast/toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  auth = inject(Auth);
  notificationService = inject(NotificationService);
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
