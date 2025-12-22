import { TestBed } from '@angular/core/testing';
import { SalesUploadComponent } from './sales-upload.component';
import { SalesService } from '../../services/sales.service';
import { ImportService } from '../../services/import.service';
import { UserService } from '../../services/user.service';
import { NotificationService } from '../../services/notification.service';
import { of } from 'rxjs';

class SalesServiceMock {
  uploadSales = jasmine.createSpy('uploadSales').and.returnValue(of([]));
}
class ImportServiceMock {
  getImports = jasmine.createSpy('getImports').and.returnValue(of([]));
  getDeletionStatus = jasmine.createSpy('getDeletionStatus').and.returnValue(of({ status: 'idle' }));
  deleteImport = jasmine.createSpy('deleteImport').and.returnValue(of({}));
}
class UserServiceMock {}
class NotificationServiceMock {
  info = jasmine.createSpy('info');
  success = jasmine.createSpy('success');
  error = jasmine.createSpy('error');
  warning = jasmine.createSpy('warning');
  onImportStatusChange = () => of();
}

describe('SalesUploadComponent', () => {
  let component: SalesUploadComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesUploadComponent],
      providers: [
        { provide: SalesService, useClass: SalesServiceMock },
        { provide: ImportService, useClass: ImportServiceMock },
        { provide: UserService, useClass: UserServiceMock },
        { provide: NotificationService, useClass: NotificationServiceMock },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SalesUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('transformDataToSalesWithMappings should group by external_sales_id when present', () => {
    const data = [
      { id: 'X1', date: '01/02/2025', time: '10:00 AM', buyer: 'Jane', desc: 'Item A', listed: '01/01/2025', price: '10' },
      { id: 'X1', date: '01/02/2025', time: '10:00 AM', buyer: 'Jane', desc: 'Item B', listed: '01/01/2025', price: '15' },
    ];
    const mappings = [
      { csvColumn: 'id', dbField: 'external_sales_id', category: 'sale' as const },
      { csvColumn: 'date', dbField: 'date_sold', category: 'sale' as const },
      { csvColumn: 'time', dbField: 'time_sold', category: 'sale' as const },
      { csvColumn: 'buyer', dbField: 'buyer', category: 'sale' as const },
      { csvColumn: 'price', dbField: 'sold_price', category: 'sale' as const },
      { csvColumn: 'desc', dbField: 'description', category: 'listing' as const },
      { csvColumn: 'listed', dbField: 'date_listed', category: 'listing' as const },
      { csvColumn: 'price', dbField: 'listed_price', category: 'listing' as const },
    ];

    component.dateFormat = 'DMY';
    const sales = component.transformDataToSalesWithMappings(data as any[], mappings as any);
    expect(sales.length).toBe(1);
    const s = sales[0] as any;
    expect(s.__groupingMethod).toBe('external_id');
    expect(s.__mergedCount).toBe(2);
    expect(s.external_sales_id).toBe('X1');
  });

  it('runPreflightValidation should add errors for missing date or products', () => {
    const bad: any = [{
      date_sold: undefined,
      products: [],
      total: 10,
      total_fee: 1,
      sold_price: 9,
    }];
    (component as any).processedSales = bad;
    (component as any).runPreflightValidation();
    expect(component.validationErrors.length).toBeGreaterThan(0);
    const fields = component.validationErrors.map(e => e.field);
    expect(fields).toContain('date_sold');
    expect(fields).toContain('products');
  });

  it('uploadProcessedSales should strip review meta and call SalesService', () => {
    const sv = TestBed.inject(SalesService) as any as SalesServiceMock;
    (component as any).processedSales = [{ __groupingKey: 'a', __groupingMethod: 'unique', __mergedCount: 1, date_sold: new Date(), products: [{}], total: 0, total_fee: 0, sold_price: 0 }];
    component.validationErrors = [];
    component.uploadProcessedSales();
    expect(sv.uploadSales).toHaveBeenCalled();
    const payload = sv.uploadSales.calls.mostRecent().args[0];
    expect(payload[0].__groupingKey).toBeUndefined();
    expect(payload[0].__groupingMethod).toBeUndefined();
    expect(payload[0].__mergedCount).toBeUndefined();
  });
});
