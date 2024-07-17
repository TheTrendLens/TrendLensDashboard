import {Component, OnInit} from '@angular/core';
import {Form, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {UserService} from "../../../services/user.service";
import {AuthService} from "../../../services/auth.service";

@Component({
  selector: 'app-user-link-form',
  templateUrl: './user-link-form.component.html',
  styleUrls: ['./user-link-form.component.css']
})
export class UserLinkFormComponent implements OnInit {
  myForm: FormGroup = new FormGroup<any>({});

  constructor(public authService: AuthService, private userService: UserService) {
  }

  ngOnInit() {
    this.myForm = new FormGroup({
      depopUsername: new FormControl('', Validators.required)
    });
  }

  onSubmit(form: FormGroup) {
    if (form.valid) {
      this.authService.afAuth.authState.subscribe({
        next: (user) => {
          if (user) {
            let body = {
              depop_id: form.value.depopUsername
            }
            this.userService.update(user.uid, body).subscribe({
              next: (data) => {
                console.log(data)
              },
              error: (err) => console.error(err)
            })
          }
        }
      });
    }
  }
}
