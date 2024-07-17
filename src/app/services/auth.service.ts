import {Injectable, NgZone} from '@angular/core';
import {GoogleAuthProvider} from "@firebase/auth";
import {HttpClient} from "@angular/common/http";
import {AngularFirestore} from "@angular/fire/compat/firestore";
import {AngularFireAuth} from "@angular/fire/compat/auth";
import {Router} from "@angular/router";
import {User} from "../models/user";
import {UserService} from "./user.service";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  userData: any;

  constructor(public afs: AngularFirestore, public afAuth: AngularFireAuth, public router: Router, public ngZone: NgZone, private http: HttpClient, private userService: UserService) {
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.userData = user;
        localStorage.setItem('user', JSON.stringify(this.userData));

        this.userService.isAdmin().subscribe({
          next: (data) => {
            localStorage.setItem('admin', data.toString());
          },
          error: (err) => console.error(err)
        });

        this.userService.get().subscribe({
          next: (data) => {
            localStorage.setItem('dbUser', JSON.stringify(data));
          },
          error: (err) => console.error(err)
        });

      } else {
        localStorage.setItem('user', 'null');
        localStorage.setItem('dbUser', 'null');
        localStorage.setItem('admin', 'null');
      }
    })
  }

  login(email: string, password: string) {
    return this.afAuth
      .signInWithEmailAndPassword(email, password)
      .then((result) => {
        this.afAuth.authState.subscribe((user) => {
          if (user) {
            console.log(user)
            this.router.navigate(['sales']);
          }
        });
      }).catch((error) => {
        window.alert(error.message);
      })
  }

  signUp(email: string, password: string) {
    return this.afAuth
      .createUserWithEmailAndPassword(email, password)
      .then((result) => {
        if (result.user && result.user.email) {
          this.userService.create(result.user.uid, result.user.email).subscribe();
        }
        this.sendVerificationMail();
        this.router.navigate(['checkout']);
      })
      .catch((error) => {
        window.alert(error.message);
      })
  }

  sendVerificationMail() {
    return this.afAuth.currentUser
      .then((u: any) => u.sendEmailVerification())
      .then(() => {

      })
  }

  forgotPassword(passwordResetEmail: string) {
    return this.afAuth
      .sendPasswordResetEmail(passwordResetEmail)
      .then(() => {
        window.alert('Password reset email sent, check your inbox')
      })
      .catch((error) => {
        window.alert(error);
      })
  }

  googleAuth() {
    return this.authLogin(new GoogleAuthProvider())
      .then((res: any) => this.router.navigate(['sales']));
  }

  authLogin(provider: any) {
    return this.afAuth
      .signInWithPopup(provider)
      .then((result) => {
        console.log('result', result)
        if (result.user && result.user.email) {
          if (result.additionalUserInfo?.isNewUser) {
            this.userService.create(result.user.uid, result.user.email).subscribe();
          }
        }
        this.router.navigate(['sales']);
      })
      .catch((error) => {
        window.alert(error);
      })
  }

  signOut() {
    console.log('SIGN OUT')
    return this.afAuth.signOut().then(() => {
      localStorage.removeItem('user');
      this.router.navigate(['sign-in']);
    })
  }

  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user')!);
    return user !== null;
  }

  get isAdmin(): boolean {
    console.log(localStorage.getItem('admin')!);
    return JSON.parse(localStorage.getItem('admin')!) === 'true';
  }

  get isSubscriber(): boolean {
    const user: User = JSON.parse(localStorage.getItem('dbUser')!);

    if (user)
      if (user.active_package)
        return user.active_package
      else
        return false;
    else
      return false;
  }
}
