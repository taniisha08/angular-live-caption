import { TestBed } from '@angular/core/testing';

import { MicLevelServiceService } from './mic-level.service.service';

describe('MicLevelServiceService', () => {
  let service: MicLevelServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MicLevelServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
