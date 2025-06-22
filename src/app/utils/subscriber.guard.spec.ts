import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { subscriberGuard } from './subscriber.guard';

describe('subscriberGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => subscriberGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
