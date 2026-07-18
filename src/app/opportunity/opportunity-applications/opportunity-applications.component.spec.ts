import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { OpportunityApplicationsComponent } from './opportunity-applications.component';
import { CandidatureService } from '../services/candidature.service';
import { OpportunityService } from '../services/opportunity.service';
import { VolunteerProfileService } from '../../user/services/volunteer-profile.service';
import { ApplicationResponse } from '../../models/application.model';

describe('OpportunityApplicationsComponent', () => {
  let component: OpportunityApplicationsComponent;
  let fixture: ComponentFixture<OpportunityApplicationsComponent>;
  let candidatureService: jasmine.SpyObj<CandidatureService>;
  let opportunityService: jasmine.SpyObj<OpportunityService>;
  let volunteerProfileService: jasmine.SpyObj<VolunteerProfileService>;

  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

  const applications: ApplicationResponse[] = [
    { id: '1', volunteeringId: 'v1', opportunityId: 'opp1', status: 'PENDING', appliedAt: daysAgo(1) },
    { id: '2', volunteeringId: 'v2', opportunityId: 'opp1', status: 'PENDING', appliedAt: daysAgo(2) },
    { id: '3', volunteeringId: 'v3', opportunityId: 'opp1', status: 'ACCEPTED', appliedAt: daysAgo(10) },
    { id: '4', volunteeringId: 'v4', opportunityId: 'opp1', status: 'REJECTED', appliedAt: daysAgo(12) },
    { id: '5', volunteeringId: 'v5', opportunityId: 'opp1', status: 'ACCEPTED', appliedAt: daysAgo(3) }
  ];

  function setup(apps: ApplicationResponse[] = applications, volunteersNeeded: number | null = 4): void {
    candidatureService = jasmine.createSpyObj('CandidatureService', ['getOpportunityApplications', 'patchStatus']);
    opportunityService = jasmine.createSpyObj('OpportunityService', ['getOpportunityById']);
    volunteerProfileService = jasmine.createSpyObj('VolunteerProfileService', ['getPublicProfileById']);

    candidatureService.getOpportunityApplications.and.returnValue(of(apps));
    opportunityService.getOpportunityById.and.returnValue(of({
      id: 'opp1', title: 'Nettoyage du Wouri', volunteersNeeded
    } as any));
    volunteerProfileService.getPublicProfileById.and.callFake((id: string | number) =>
      of({ id: Number(id), username: `user${id}`, firstName: 'Aline', lastName: 'Nkomo' } as any));

    TestBed.configureTestingModule({
      imports: [OpportunityApplicationsComponent],
      providers: [
        provideRouter([]),
        { provide: CandidatureService, useValue: candidatureService },
        { provide: OpportunityService, useValue: opportunityService },
        { provide: VolunteerProfileService, useValue: volunteerProfileService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'opp1']]) } } }
      ]
    });

    fixture = TestBed.createComponent(OpportunityApplicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('should create and load applications', () => {
    setup();
    expect(component).toBeTruthy();
    expect(component.totalCount).toBe(5);
    expect(component.volunteersNeeded).toBe(4);
  });

  describe('metrics', () => {
    beforeEach(() => setup());

    it('should count applications by status', () => {
      expect(component.pendingCount).toBe(2);
      expect(component.acceptedCount).toBe(2);
      expect(component.countByStatus('REJECTED')).toBe(1);
      expect(component.countByStatus('VIEW')).toBe(0);
    });

    it('should count applications received in the last 7 days', () => {
      expect(component.recentCount).toBe(3);
    });

    it('should compute the processed percentage (everything except PENDING)', () => {
      // 3 traitées sur 5 → 60 %
      expect(component.processedPercent).toBe(60);
    });

    it('should compute the filled percentage against volunteersNeeded', () => {
      // 2 acceptées sur 4 recherchés → 50 %
      expect(component.filledPercent).toBe(50);
    });

    it('should build status segments only for non-empty statuses, in fixed order', () => {
      const segments = component.statusSegments;
      expect(segments.map(s => s.status)).toEqual(['ACCEPTED', 'PENDING', 'REJECTED']);
      expect(segments[0].count).toBe(2);
      expect(segments[0].percent).toBeCloseTo(40);
    });
  });

  it('should cap the filled percentage at 100', () => {
    setup(applications, 1); // 2 acceptées pour 1 recherché
    expect(component.filledPercent).toBe(100);
  });

  it('should report 0 percent processed and filled when there is no data', () => {
    setup([], null);
    expect(component.totalCount).toBe(0);
    expect(component.processedPercent).toBe(0);
    expect(component.filledPercent).toBe(0);
    expect(component.statusSegments).toEqual([]);
  });

  describe('volunteer name resolution', () => {
    beforeEach(() => setup());

    it('should resolve applicant profiles once per unique volunteer', () => {
      // 5 candidatures mais 5 volontaires distincts (v1..v5)
      expect(volunteerProfileService.getPublicProfileById).toHaveBeenCalledTimes(5);
    });

    it('should display the applicant full name and username link', () => {
      expect(component.volunteerName(applications[0])).toBe('Aline Nkomo');
      expect(component.volunteerUsername(applications[0])).toBe('userv1');
    });

    it('should fall back to the id when the profile cannot be resolved', () => {
      const unknown = { ...applications[0], volunteeringId: 'v-missing' };
      expect(component.volunteerName(unknown)).toBe('Candidat #v-missing');
      expect(component.volunteerUsername(unknown)).toBeNull();
    });
  });

  it('should render the dashboard tiles when applications exist', () => {
    setup();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Candidatures');
    expect(text).toContain('En attente');
    expect(text).toContain('Répartition par statut');
    expect(text).toContain('Places pourvues');
  });
});
