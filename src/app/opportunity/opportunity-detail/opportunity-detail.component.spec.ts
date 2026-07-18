import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { OpportunityDetailComponent } from './opportunity-detail.component';
import { OpportunityService } from '../services/opportunity.service';
import { CandidatureService } from '../services/candidature.service';
import { AuthService } from '../../auth/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Opportunity } from '../../models/opportunity.model';

const mockOpportunity: Opportunity = {
  id: '42',
  title: 'Aide aux personnes âgées',
  description: 'Description test',
  location: 'Paris',
  town: 'Paris',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  requirements: 'Patience',
  orgId: 1,
  skillsRequired: [],
  categories: []
};

describe('OpportunityDetailComponent', () => {
  let component: OpportunityDetailComponent;
  let fixture: ComponentFixture<OpportunityDetailComponent>;
  let mockOpportunityService: jasmine.SpyObj<OpportunityService>;
  let mockCandidatureService: jasmine.SpyObj<CandidatureService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  function createComponent(id: string | null) {
    return TestBed.configureTestingModule({
      imports: [OpportunityDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => id } } } },
        { provide: OpportunityService, useValue: mockOpportunityService },
        { provide: CandidatureService, useValue: mockCandidatureService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents().then(() => {
      fixture = TestBed.createComponent(OpportunityDetailComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });
  }

  beforeEach(() => {
    mockOpportunityService = jasmine.createSpyObj('OpportunityService', ['getOpportunityById']);
    mockCandidatureService = jasmine.createSpyObj('CandidatureService', ['getVolunteerApplications', 'applyToOpportunity']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['getUserData']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    mockCandidatureService.getVolunteerApplications.and.returnValue(of([]));
    mockAuthService.getUserData.and.returnValue(null);
  });

  it('should create', async () => {
    mockOpportunityService.getOpportunityById.and.returnValue(of(mockOpportunity));
    await createComponent('42');
    expect(component).toBeTruthy();
  });

  it('should set errorMessage when no id in route', async () => {
    await createComponent(null);
    expect(component.errorMessage).toBe('ID d\'opportunité manquant');
    expect(component.isLoading).toBeFalse();
    expect(mockOpportunityService.getOpportunityById).not.toHaveBeenCalled();
  });

  it('should load opportunity from API when id is present', async () => {
    mockOpportunityService.getOpportunityById.and.returnValue(of(mockOpportunity));
    await createComponent('42');
    expect(mockOpportunityService.getOpportunityById).toHaveBeenCalledWith('42');
    expect(component.opportunity).toEqual(mockOpportunity);
    expect(component.isLoading).toBeFalse();
  });

  it('should set errorMessage when API call fails', async () => {
    mockOpportunityService.getOpportunityById.and.returnValue(
      throwError(() => new Error('Erreur serveur interne'))
    );
    await createComponent('42');
    expect(component.errorMessage).toBe('Erreur serveur interne');
    expect(component.isLoading).toBeFalse();
  });
});
