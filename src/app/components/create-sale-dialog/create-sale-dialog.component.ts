import {Component, Inject} from '@angular/core';
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
export class CreateSaleDialogComponent {
  saleForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    public dialogRef: MatDialogRef<CreateSaleDialogComponent>,
    private salesService: SalesService
  ) {
    this.saleForm = formBuilder.group({
      buyer: ['', Validators.required],
      date_sold: [new Date(), Validators.required],
      payment_type: ['', Validators.required],
      total: [0, [Validators.required, Validators.min(0)]],
      platform_fee: [0, [Validators.required, Validators.min(0)]],
      payment_fee: [0, [Validators.required, Validators.min(0)]],
      seller_postage_cost: [0, [Validators.required, Validators.min(0)]],
      boosting_fee: [0, Validators.min(0)],
      offer: [false]
    });
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.saleForm.valid) {
      const sale: Partial<Sale> = {
        ...this.saleForm.value,
        time_sold: new Date().toTimeString().split(' ')[0],
        total_fee: +this.saleForm.value.platform_fee + +this.saleForm.value.payment_fee + +this.saleForm.value.boosting_fee,
        products: []
      };

      this.dialogRef.close(sale);
    }
  }
}
