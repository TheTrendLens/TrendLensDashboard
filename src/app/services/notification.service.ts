import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { io, Socket } from 'socket.io-client';
import {UserService} from './user.service';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private socket: Socket | undefined;

  constructor(private userService: UserService, private snackBar: MatSnackBar) {}

  connect() {
    const user = this.userService.getCurrentUser()!;
    if (!user || (this.socket && this.socket.connected)) {
      return;
    }

    // Connect to the backend, passing the userId as a query parameter
    this.socket = io(`${environment.backend.baseURL}`, {
      query: { userId: user.id },
    });

    this.socket.on('connect', () => {
      console.log('Connected to notification server');
    });

    // Listen for the 'import-status' event from the server
    this.socket.on('import-status', (data) => {
      console.log('Notification received:', data);

      const panelClass = data.status === 'completed' ? 'success-snackbar' : 'error-snackbar';

      this.snackBar.open(data.message, 'Close', {
        duration: 10000,
        panelClass: [panelClass]
      });
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification server');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
