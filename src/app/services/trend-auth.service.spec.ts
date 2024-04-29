import { TestBed } from '@angular/core/testing';

import { TrendAuthService } from './trend-auth.service';

describe('TrendAuthService', () => {
  let service: TrendAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrendAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
