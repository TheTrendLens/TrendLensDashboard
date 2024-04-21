import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserLinkFormComponent } from './user-link-form.component';

describe('UserLinkFormComponent', () => {
  let component: UserLinkFormComponent;
  let fixture: ComponentFixture<UserLinkFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserLinkFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserLinkFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
