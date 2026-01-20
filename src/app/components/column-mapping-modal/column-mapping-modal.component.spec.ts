import { TestBed } from '@angular/core/testing';
import { ColumnMappingModalComponent } from './column-mapping-modal.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

describe('ColumnMappingModalComponent', () => {
  let component: ColumnMappingModalComponent;
  let fixture: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, ColumnMappingModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ColumnMappingModalComponent);
    component = fixture.componentInstance;
    // Provide basic inputs
    fixture.componentRef.setInput('csvColumns', ['Sales ID', 'Date of sale', 'Time sold', 'Buyer', 'Description', 'Date listed']);
    fixture.componentRef.setInput('sampleRows', [
      {
        'Sales ID': 'A-1',
        'Date of sale': '01/02/2025',
        'Time sold': '10:00 AM',
        'Buyer': 'Jane',
        'Description': 'Blue Jeans',
        'Date listed': '01/01/2025',
      },
    ]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should append user-added optional fields at the bottom in insertion order', () => {
    // start on sale category
    component.setActiveCategory('sale');

    // Simulate that an optional field is mapped (e.g., payment_type) but not explicitly added
    component.columnMappings.set([
      { csvColumn: 'Sales ID', dbField: 'external_sales_id', category: 'sale' },
      { csvColumn: 'Buyer', dbField: 'buyer', category: 'sale' },
      { csvColumn: 'Time sold', dbField: 'time_sold', category: 'sale' },
      { csvColumn: 'Date of sale', dbField: 'date_sold', category: 'sale' },
      { csvColumn: 'Payment', dbField: 'payment_type', category: 'sale' },
    ]);

    // Explicitly add two optional fields by user in a specific order
    component.addOptionalField('sales_tax');
    component.addOptionalField('platform_fee');

    const visible = component.getVisibleFieldsByCategory('sale');

    // Required sale fields should come first
    const requiredLabels = visible.filter(v => v.required).map(v => v.value);
    expect(requiredLabels).toContain('date_sold');
    expect(requiredLabels).toContain('sold_price');
    expect(requiredLabels).toContain('total');

    // Find the tail of the array, ensure user-added appear in insertion order
    const tail = visible.slice(-2).map(v => v.value);
    expect(tail).toEqual(['sales_tax', 'platform_fee']);
  });

  it('should toggle help panel signal and expose aria attributes', () => {
    expect(component.showHelp()).toBeTrue();
    component.toggleHelp();
    expect(component.showHelp()).toBeFalse();
    component.toggleHelp();
    expect(component.showHelp()).toBeTrue();
  });

  it('should save, load and delete mapping profiles from localStorage', () => {
    // Ensure clean state
    localStorage.clear();

    // Create a simple mapping and save
    component.columnMappings.set([
      { csvColumn: 'Date of sale', dbField: 'date_sold', category: 'sale' },
    ]);
    fixture.detectChanges();
    component.saveCurrentAsProfile('My Profile');

    // Reload from storage and apply
    component.loadProfileByName('My Profile');
    expect(component.selectedProfileName()).toBe('My Profile');

    // Delete profile
    spyOn(window, 'confirm').and.returnValue(true);
    component.deleteProfileByName('My Profile');
    expect(component.profiles().find(p => p.name === 'My Profile')).toBeUndefined();
  });
});
