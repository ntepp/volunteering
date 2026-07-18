import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { OpportunityListComponent } from './opportunity-list.component';
import { OpportunityService } from '../services/opportunity.service';
import { AuthService } from '../../auth/services/auth.service';
import { VolunteerProfileService } from '../../user/services/volunteer-profile.service';

const defaultPagination = {
  opportunities: [],
  totalItems: 0,
  totalPages: 0,
  currentPage: 0,
  itemsPerPage: 10
};

function makeOpportunityServiceSpy(): jasmine.SpyObj<OpportunityService> {
  return jasmine.createSpyObj('OpportunityService', [
    'getOpportunitiesWithFilters',
    'getCategories',
    'getFeed'
  ]);
}

function makeAuthServiceSpy(): jasmine.SpyObj<AuthService> {
  return jasmine.createSpyObj('AuthService', ['isAuthenticated', 'getUserRole']);
}

function makeVolunteerProfileServiceSpy(): jasmine.SpyObj<VolunteerProfileService> {
  return jasmine.createSpyObj('VolunteerProfileService', ['getMyProfile']);
}

describe('OpportunityListComponent', () => {
  let component: OpportunityListComponent;
  let fixture: ComponentFixture<OpportunityListComponent>;
  let opportunityService: jasmine.SpyObj<OpportunityService>;
  let authService: jasmine.SpyObj<AuthService>;
  let volunteerProfileService: jasmine.SpyObj<VolunteerProfileService>;

  function createComponent(
    authSetup: { isAuthenticated: boolean; role: string | null } = { isAuthenticated: false, role: null },
    preferredCategories: string[] = [],
    feedData: { preferred: any[]; recent: any[] } = { preferred: [], recent: [] }
  ) {
    opportunityService = makeOpportunityServiceSpy();
    authService = makeAuthServiceSpy();
    volunteerProfileService = makeVolunteerProfileServiceSpy();

    opportunityService.getOpportunitiesWithFilters.and.returnValue(of(defaultPagination));
    opportunityService.getCategories.and.returnValue(of([]));
    opportunityService.getFeed.and.returnValue(of(feedData));
    authService.isAuthenticated.and.returnValue(authSetup.isAuthenticated);
    authService.getUserRole.and.returnValue(authSetup.role);
    volunteerProfileService.getMyProfile.and.returnValue(of({ id: 1, username: 'volunteer', preferredCategories }));

    TestBed.configureTestingModule({
      imports: [OpportunityListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: OpportunityService, useValue: opportunityService },
        { provide: AuthService, useValue: authService },
        { provide: VolunteerProfileService, useValue: volunteerProfileService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OpportunityListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('Basic creation', () => {
    it('should create', () => {
      createComponent();
      expect(component).toBeTruthy();
    });

    it('should call getOpportunitiesWithFilters on init', () => {
      createComponent();
      expect(opportunityService.getOpportunitiesWithFilters).toHaveBeenCalled();
    });

    it('should call getCategories on init', () => {
      createComponent();
      expect(opportunityService.getCategories).toHaveBeenCalled();
    });
  });

  describe('Feed — non-authenticated user', () => {
    beforeEach(() => {
      createComponent(
        { isAuthenticated: false, role: null },
        [],
        { preferred: [], recent: [{ id: 'r1', title: 'Recent Opp', description: 'desc', startDate: '2025-01-01', endDate: '2025-02-01', tags: [] }] }
      );
    });

    it('should call getFeed with empty categories when not authenticated', () => {
      expect(opportunityService.getFeed).toHaveBeenCalledWith([]);
    });

    it('should set isVolunteer to false', () => {
      expect(component.isVolunteer).toBeFalse();
    });

    it('should populate feedRecent', () => {
      expect(component.feedRecent.length).toBe(1);
    });

    it('should keep feedPreferred empty', () => {
      expect(component.feedPreferred.length).toBe(0);
    });

    it('should display Opportunités récentes section when feedRecent has items', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Opportunités récentes');
    });

    it('should NOT display Pour vous section when not volunteer', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).not.toContain('Pour vous');
    });
  });

  describe('Feed — authenticated organization user', () => {
    beforeEach(() => {
      createComponent(
        { isAuthenticated: true, role: 'ORGANIZATION' },
        [],
        { preferred: [], recent: [{ id: 'r1', title: 'Recent Opp', description: 'desc', startDate: '2025-01-01', endDate: '2025-02-01', tags: [] }] }
      );
    });

    it('should call getFeed with empty categories', () => {
      expect(opportunityService.getFeed).toHaveBeenCalledWith([]);
    });

    it('should set isVolunteer to false', () => {
      expect(component.isVolunteer).toBeFalse();
    });

    it('should NOT display Pour vous section', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).not.toContain('Pour vous');
    });
  });

  describe('Feed — authenticated volunteer user', () => {
    const preferredCats = ['Education', 'Environment'];
    const feedData = {
      preferred: [
        { id: 'p1', title: 'Preferred Opp', description: 'pref desc', startDate: '2025-01-01', endDate: '2025-02-01', tags: ['NEW'] },
        { id: 'p2', title: 'Urgent Opp', description: 'urgent desc', startDate: '2025-03-01', endDate: '2025-04-01', tags: ['URGENT'] }
      ],
      recent: [
        { id: 'r1', title: 'Recent Opp', description: 'recent desc', startDate: '2025-05-01', endDate: '2025-06-01', tags: [] }
      ]
    };

    beforeEach(() => {
      createComponent(
        { isAuthenticated: true, role: 'VOLUNTEER' },
        preferredCats,
        feedData
      );
    });

    it('should call getMyProfile when user is a volunteer', () => {
      expect(volunteerProfileService.getMyProfile).toHaveBeenCalled();
    });

    it('should call getFeed with preferred categories', () => {
      expect(opportunityService.getFeed).toHaveBeenCalledWith(preferredCats);
    });

    it('should set isVolunteer to true', () => {
      expect(component.isVolunteer).toBeTrue();
    });

    it('should populate feedPreferred with preferred opportunities', () => {
      expect(component.feedPreferred.length).toBe(2);
      expect(component.feedPreferred[0].id).toBe('p1');
    });

    it('should populate feedRecent with recent opportunities', () => {
      expect(component.feedRecent.length).toBe(1);
      expect(component.feedRecent[0].id).toBe('r1');
    });

    it('should display Pour vous section', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Pour vous');
    });

    it('should display Opportunités récentes section', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Opportunités récentes');
    });

    it('should display NEW chip on opportunity with NEW tag', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const chips = compiled.querySelectorAll('.tag-new');
      expect(chips.length).toBeGreaterThan(0);
      expect(chips[0].textContent?.trim()).toBe('Nouveau');
    });

    it('should display URGENT chip on opportunity with URGENT tag', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const chips = compiled.querySelectorAll('.tag-urgent');
      expect(chips.length).toBeGreaterThan(0);
      expect(chips[0].textContent?.trim()).toBe('Urgent');
    });
  });

  describe('Feed — error handling', () => {
    it('should not block display when getFeed fails (non-volunteer)', () => {
      opportunityService = makeOpportunityServiceSpy();
      authService = makeAuthServiceSpy();
      volunteerProfileService = makeVolunteerProfileServiceSpy();

      opportunityService.getOpportunitiesWithFilters.and.returnValue(of(defaultPagination));
      opportunityService.getCategories.and.returnValue(of([]));
      opportunityService.getFeed.and.returnValue(throwError(() => new Error('Network error')));
      authService.isAuthenticated.and.returnValue(false);
      authService.getUserRole.and.returnValue(null);

      TestBed.configureTestingModule({
        imports: [OpportunityListComponent],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          { provide: OpportunityService, useValue: opportunityService },
          { provide: AuthService, useValue: authService },
          { provide: VolunteerProfileService, useValue: volunteerProfileService }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(OpportunityListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.feedPreferred).toEqual([]);
      expect(component.feedRecent).toEqual([]);
      expect(component).toBeTruthy();
    });

    it('should not block display when getFeed fails (volunteer)', fakeAsync(() => {
      opportunityService = makeOpportunityServiceSpy();
      authService = makeAuthServiceSpy();
      volunteerProfileService = makeVolunteerProfileServiceSpy();

      opportunityService.getOpportunitiesWithFilters.and.returnValue(of(defaultPagination));
      opportunityService.getCategories.and.returnValue(of([]));
      opportunityService.getFeed.and.returnValue(throwError(() => new Error('Network error')));
      authService.isAuthenticated.and.returnValue(true);
      authService.getUserRole.and.returnValue('VOLUNTEER');
      volunteerProfileService.getMyProfile.and.returnValue(of({ id: 1, username: 'vol', preferredCategories: [] }));

      TestBed.configureTestingModule({
        imports: [OpportunityListComponent],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          { provide: OpportunityService, useValue: opportunityService },
          { provide: AuthService, useValue: authService },
          { provide: VolunteerProfileService, useValue: volunteerProfileService }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(OpportunityListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(component.feedPreferred).toEqual([]);
      expect(component.feedRecent).toEqual([]);
      expect(component).toBeTruthy();
    }));

    it('should not block display when getMyProfile fails', fakeAsync(() => {
      opportunityService = makeOpportunityServiceSpy();
      authService = makeAuthServiceSpy();
      volunteerProfileService = makeVolunteerProfileServiceSpy();

      opportunityService.getOpportunitiesWithFilters.and.returnValue(of(defaultPagination));
      opportunityService.getCategories.and.returnValue(of([]));
      opportunityService.getFeed.and.returnValue(of({ preferred: [], recent: [] }));
      authService.isAuthenticated.and.returnValue(true);
      authService.getUserRole.and.returnValue('VOLUNTEER');
      volunteerProfileService.getMyProfile.and.returnValue(throwError(() => new Error('Profile error')));

      TestBed.configureTestingModule({
        imports: [OpportunityListComponent],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          { provide: OpportunityService, useValue: opportunityService },
          { provide: AuthService, useValue: authService },
          { provide: VolunteerProfileService, useValue: volunteerProfileService }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(OpportunityListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      // getFeed called with empty array as fallback
      expect(opportunityService.getFeed).toHaveBeenCalledWith([]);
      expect(component).toBeTruthy();
    }));
  });

  describe('Urgency tag chips on main list cards', () => {
    beforeEach(() => {
      opportunityService = makeOpportunityServiceSpy();
      authService = makeAuthServiceSpy();
      volunteerProfileService = makeVolunteerProfileServiceSpy();

      const paginationWithTags = {
        opportunities: [
          { id: '1', title: 'New Opp', description: 'desc', location: '', town: 'Paris', startDate: '2025-01-01', endDate: '2025-02-01', requirements: '', orgId: 1, skillsRequired: [], categories: [], tags: ['NEW'] },
          { id: '2', title: 'Urgent Opp', description: 'desc', location: '', town: 'Lyon', startDate: '2025-01-01', endDate: '2025-02-01', requirements: '', orgId: 1, skillsRequired: [], categories: [], tags: ['URGENT'] },
          { id: '3', title: 'Both tags', description: 'desc', location: '', town: 'Nice', startDate: '2025-01-01', endDate: '2025-02-01', requirements: '', orgId: 1, skillsRequired: [], categories: [], tags: ['NEW', 'URGENT'] },
          { id: '4', title: 'No tags', description: 'desc', location: '', town: 'Lille', startDate: '2025-01-01', endDate: '2025-02-01', requirements: '', orgId: 1, skillsRequired: [], categories: [], tags: [] }
        ],
        totalItems: 4,
        totalPages: 1,
        currentPage: 0,
        itemsPerPage: 10
      };

      opportunityService.getOpportunitiesWithFilters.and.returnValue(of(paginationWithTags));
      opportunityService.getCategories.and.returnValue(of([]));
      opportunityService.getFeed.and.returnValue(of({ preferred: [], recent: [] }));
      authService.isAuthenticated.and.returnValue(false);
      authService.getUserRole.and.returnValue(null);

      TestBed.configureTestingModule({
        imports: [OpportunityListComponent],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          { provide: OpportunityService, useValue: opportunityService },
          { provide: AuthService, useValue: authService },
          { provide: VolunteerProfileService, useValue: volunteerProfileService }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(OpportunityListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should display Nouveau chip for opportunity with NEW tag', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const newChips = compiled.querySelectorAll('.tag-new');
      // 2 cards have NEW tag (id 1 and id 3)
      expect(newChips.length).toBe(2);
    });

    it('should display Urgent chip for opportunity with URGENT tag', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const urgentChips = compiled.querySelectorAll('.tag-urgent');
      // 2 cards have URGENT tag (id 2 and id 3)
      expect(urgentChips.length).toBe(2);
    });

    it('should not display any chip for opportunity with no tags', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      // Check total chip count: 2 NEW + 2 URGENT = 4 chips total
      const allChips = compiled.querySelectorAll('.tag-new, .tag-urgent');
      expect(allChips.length).toBe(4);
    });
  });

  describe('Filters applied to feed sections', () => {
    const feedData = {
      preferred: [
        { id: 'p1', title: 'Aide alimentaire', description: 'd', town: 'Paris', startDate: '2026-08-01', endDate: '2026-09-01', workType: 'ON_SITE', categoryNames: ['Solidarité'], tags: [] }
      ],
      recent: [
        { id: 'r1', title: 'Nettoyage du Wouri', description: 'd', town: 'Douala', startDate: '2026-12-15', endDate: '2027-01-30', workType: 'ON_SITE', categoryNames: ['Environnement'], tags: [] },
        { id: 'r2', title: 'Soutien scolaire', description: 'd', town: 'Lyon', startDate: '2026-07-25', endDate: '2026-12-20', workType: 'REMOTE', categoryNames: ['Éducation'], tags: [] }
      ]
    };

    beforeEach(() => {
      createComponent({ isAuthenticated: true, role: 'VOLUNTEER' }, ['Solidarité'], feedData);
    });

    it('should show the full feed when no filter is active', () => {
      expect(component.filteredFeedRecent.length).toBe(2);
      expect(component.filteredFeedPreferred.length).toBe(1);
    });

    it('should filter feed sections by title (case-insensitive contains)', () => {
      component.filtersForm.patchValue({ title: 'wouri' });
      expect(component.filteredFeedRecent.map(o => o.id)).toEqual(['r1']);
      expect(component.filteredFeedPreferred.length).toBe(0);
    });

    it('should filter feed sections by town', () => {
      component.filtersForm.patchValue({ town: 'lyon' });
      expect(component.filteredFeedRecent.map(o => o.id)).toEqual(['r2']);
    });

    it('should filter feed sections by category', () => {
      component.filtersForm.patchValue({ category: 'Environnement' });
      expect(component.filteredFeedRecent.map(o => o.id)).toEqual(['r1']);
      expect(component.filteredFeedPreferred.length).toBe(0);
    });

    it('should filter feed sections by workType', () => {
      component.filtersForm.patchValue({ workType: 'REMOTE' });
      expect(component.filteredFeedRecent.map(o => o.id)).toEqual(['r2']);
    });

    it('should filter feed sections by minimum start date', () => {
      component.filtersForm.patchValue({ startDate: '2026-10-01' });
      expect(component.filteredFeedRecent.map(o => o.id)).toEqual(['r1']);
    });

    it('should hide the Opportunités récentes section when no feed item matches', () => {
      component.filtersForm.patchValue({ title: 'inexistant' });
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).not.toContain('Opportunités récentes');
    });
  });

  describe('OpportunityService getFeed method', () => {
    it('should build correct URL without categories', () => {
      createComponent({ isAuthenticated: false, role: null }, [], { preferred: [], recent: [] });
      expect(opportunityService.getFeed).toHaveBeenCalledWith([]);
    });

    it('should build correct URL with categories (volunteer)', () => {
      createComponent(
        { isAuthenticated: true, role: 'VOLUNTEER' },
        ['Education', 'Health'],
        { preferred: [], recent: [] }
      );
      expect(opportunityService.getFeed).toHaveBeenCalledWith(['Education', 'Health']);
    });
  });
});
