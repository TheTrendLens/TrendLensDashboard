import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableSearchBarComponent } from './table-search-bar.component';

describe('TableSearchBarComponent', () => {
  let component: TableSearchBarComponent;
  let fixture: ComponentFixture<TableSearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableSearchBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableSearchBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
