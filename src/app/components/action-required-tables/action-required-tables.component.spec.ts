import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActionRequiredTablesComponent } from './action-required-tables.component';

describe('ActionRequiredTablesComponent', () => {
  let component: ActionRequiredTablesComponent;
  let fixture: ComponentFixture<ActionRequiredTablesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionRequiredTablesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ActionRequiredTablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
