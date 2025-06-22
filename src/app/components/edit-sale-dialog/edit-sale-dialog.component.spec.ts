import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSaleDialogComponent } from './edit-sale-dialog.component';

describe('EditSaleDialogComponent', () => {
  let component: EditSaleDialogComponent;
  let fixture: ComponentFixture<EditSaleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditSaleDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditSaleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
