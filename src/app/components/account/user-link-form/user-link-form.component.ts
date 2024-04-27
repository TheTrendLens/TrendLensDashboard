import {Component, OnInit} from '@angular/core';
import {Form, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {Listing} from "../../../models/listing";
import {HttpClient} from "@angular/common/http";
import {AuthService} from "@auth0/auth0-angular";
import {map} from "rxjs";
import { environment } from 'src/environments/environment';
import {UserService} from "../../../services/user.service";

@Component({
  selector: 'app-user-link-form',
  templateUrl: './user-link-form.component.html',
  styleUrls: ['./user-link-form.component.css']
})
export class UserLinkFormComponent implements OnInit {
  myForm: FormGroup = new FormGroup<any>({});

  user$ = this.auth.user$;
  code$ = this.user$.pipe(map((user) => JSON.stringify(user, null, 2)));

  constructor(public auth: AuthService, private userService: UserService) {
  }

  ngOnInit() {
    this.myForm = new FormGroup({
      depopUsername: new FormControl('', Validators.required)
    });
  }

  onSubmit(form: FormGroup) {
    if (form.valid) {
      this.user$.subscribe({
        next: (user) => {
          if (user?.email) {
            let body = {
              depop_id: form.value.depopUsername
            }
            this.userService.update(user.email, body).subscribe({
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
