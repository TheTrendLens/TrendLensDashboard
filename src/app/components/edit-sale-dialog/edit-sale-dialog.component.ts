import {Component, Inject} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import {Listing} from '../../models/listing';
import {MatButton} from '@angular/material/button';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatFormField, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatInput, MatInputModule} from '@angular/material/input';
import {Sale} from '../../models/sale';
import {SalesService} from '../../services/sales.service';
import {take} from 'rxjs';
import {MatDatepicker, MatDatepickerInput, MatDatepickerToggle} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';

@Component({
  selector: 'app-edit-sale-dialog',
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
  templateUrl: './edit-sale-dialog.component.html',
  styleUrl: './edit-sale-dialog.component.css'
})
export class EditSaleDialogComponent {
  salesForm: FormGroup;

  constructor(private formBuilder: FormBuilder, public dialogRef: MatDialogRef<EditSaleDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: Sale, private salesService: SalesService) {
    this.dialogRef.updateSize()
    this.salesForm = formBuilder.group({
      listing: [data.listing.slug],
      dateSold: [data.date_sold, Validators.required],
      dateListed: [data.listing.date_listed],
      listedPrice: [data.listing.listed_price],
      soldPrice: [data.listing.listed_price, Validators.required],
      size: [data.size],
      platformFee: [data.platform_fee || ''],
      paymentFee: [data.payment_fee || '', Validators.required],
      postageCost: [data.postage_cost || '', Validators.required],
      itemCost: [data.item_cost || '', Validators.required],
    })

    this.salesForm.controls['listing'].disable();
    this.salesForm.controls['dateListed'].disable();
    this.salesForm.controls['listedPrice'].disable();
    this.salesForm.controls['size'].disable();
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.salesForm.valid) {
      const sale: Sale = this.data;

      sale.date_sold = this.salesForm.value['dateSold'];
      sale.sold_price = this.salesForm.value['soldPrice'];
      sale.platform_fee = this.salesForm.value['platformFee'];
      sale.payment_fee = this.salesForm.value['paymentFee'];
      sale.postage_cost = this.salesForm.value['postageCost'];
      sale.item_cost = this.salesForm.value['itemCost'];

      this.salesService.update(sale).pipe(take(1)).subscribe(result => {
        console.log(result);
      });

      this.dialogRef.close();
    }
  }
}
