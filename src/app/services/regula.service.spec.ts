import { TestBed } from '@angular/core/testing';

import { RegulaService } from './regula.service';

describe('RegulaService', () => {
  let service: RegulaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RegulaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
