import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesUploadComponent } from './sales-upload.component';

describe('SalesUploadComponent', () => {
  let component: SalesUploadComponent;
  let fixture: ComponentFixture<SalesUploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesUploadComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalesUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
