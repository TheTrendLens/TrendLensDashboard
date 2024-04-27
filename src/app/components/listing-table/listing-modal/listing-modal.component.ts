import {Component, OnInit} from '@angular/core';
import {Sale} from "../../../models/sale";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {AuthService} from "@auth0/auth0-angular";
import {UserService} from "../../../services/user.service";
import {map} from "rxjs";

@Component({
  selector: 'app-listing-modal',
  templateUrl: './listing-modal.component.html',
  styleUrls: ['./listing-modal.component.css']
})
export class ListingModalComponent implements OnInit {
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
