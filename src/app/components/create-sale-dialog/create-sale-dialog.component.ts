import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {MatButton} from '@angular/material/button';
import {MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {Sale} from '../../models/sale';
import {SalesService} from '../../services/sales.service';
import {take} from 'rxjs';
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import {UserService} from '../../services/user.service';
import {User} from '../../models/user';

@Component({
  selector: 'app-create-sale-dialog',
  imports: [
    MatInput,
    FormsModule,
    MatFormField,
    ReactiveFormsModule,
    MatDialogContent,
    MatDialogTitle,
    MatLabel,
    MatDialogActions,
    MatButton,
    MatDatepickerInput,
    MatDatepicker,
    MatNativeDateModule,
    MatDatepickerToggle,
    MatSuffix
  ],
  templateUrl: './create-sale-dialog.component.html',
  styleUrl: './create-sale-dialog.component.css'
})
export class CreateSaleDialogComponent implements OnInit {
  saleForm: FormGroup;
  currentUser: User | null = null;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<CreateSaleDialogComponent>,
    private salesService: SalesService,
    private userService: UserService
  ) {
    this.saleForm = formBuilder.group({
      buyer: ['', Validators.required],
      date_sold: [new Date(), Validators.required],
      payment_type: [''],
      total: [0, [Validators.required, Validators.min(0)]],
      platform_fee: [0, [Validators.required, Validators.min(0)]],
      payment_fee: [0, [Validators.required, Validators.min(0)]],
      seller_postage_cost: [0, [Validators.required, Validators.min(0)]],
      boosting_fee: [0, Validators.min(0)],
      offer: [false]
    });
  }

  ngOnInit(): void {
    this.userService.get().pipe(take(1)).subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (error) => {
        console.error('Error getting current user:', error);
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.saleForm.valid) {
      if (!this.currentUser) {
        console.error('No user found. Cannot create sale.');
        return;
      }

      const sale: Partial<Sale> = {
        ...this.saleForm.value,
        time_sold: new Date().toTimeString().split(' ')[0],
        total_fee: +this.saleForm.value.platform_fee + +this.saleForm.value.payment_fee + +this.saleForm.value.boosting_fee,
        products: [],
        user: this.currentUser
      };

      this.dialogRef.close(sale);
    }
  }
}
