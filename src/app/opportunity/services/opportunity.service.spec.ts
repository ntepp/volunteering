import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { OpportunityService } from './opportunity.service';
import { environment } from '../../../environments/environment';

describe('OpportunityService', () => {
  let service: OpportunityService;
  let httpMock: HttpTestingController;

  const baseUrl = environment.apiUrl + '/api/v1/opportunities';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });
    service = TestBed.inject(OpportunityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFeed', () => {
    it('should call /feed without params when no categories provided', () => {
      const mockFeed = { preferred: [], recent: [] };
      service.getFeed([]).subscribe(feed => {
        expect(feed).toEqual(mockFeed);
      });
      const req = httpMock.expectOne(`${baseUrl}/feed`);
      expect(req.request.method).toBe('GET');
      req.flush(mockFeed);
    });

    it('should call /feed without params when categories array is omitted', () => {
      const mockFeed = { preferred: [], recent: [] };
      service.getFeed().subscribe(feed => {
        expect(feed).toEqual(mockFeed);
      });
      const req = httpMock.expectOne(`${baseUrl}/feed`);
      expect(req.request.method).toBe('GET');
      req.flush(mockFeed);
    });

    it('should call /feed with preferredCategories query param when categories are provided', () => {
      const mockFeed = {
        preferred: [
          { id: 'p1', title: 'Education Opp', description: 'desc', startDate: '2025-01-01', endDate: '2025-02-01', tags: ['NEW'] }
        ],
        recent: []
      };
      service.getFeed(['Education', 'Health']).subscribe(feed => {
        expect(feed.preferred.length).toBe(1);
        expect(feed.preferred[0].id).toBe('p1');
      });
      const req = httpMock.expectOne(`${baseUrl}/feed?preferredCategories=Education,Health`);
      expect(req.request.method).toBe('GET');
      req.flush(mockFeed);
    });

    it('should return preferred and recent arrays', () => {
      const mockFeed = {
        preferred: [
          { id: 'p1', title: 'Pref', description: 'desc', startDate: '2025-01-01', endDate: '2025-02-01', tags: [] }
        ],
        recent: [
          { id: 'r1', title: 'Recent', description: 'desc', startDate: '2025-03-01', endDate: '2025-04-01', tags: ['URGENT'] }
        ]
      };
      service.getFeed(['Cat1']).subscribe(feed => {
        expect(feed.preferred.length).toBe(1);
        expect(feed.recent.length).toBe(1);
        expect(feed.recent[0].tags).toContain('URGENT');
      });
      const req = httpMock.expectOne(`${baseUrl}/feed?preferredCategories=Cat1`);
      req.flush(mockFeed);
    });

    it('should handle server error gracefully', () => {
      service.getFeed([]).subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err.message).toBeTruthy();
        }
      });
      const req = httpMock.expectOne(`${baseUrl}/feed`);
      req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });
    });
  });
});
