import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { NotificationListComponent } from './notification-list.component';
import { CandidatureService } from '../../opportunity/services/candidature.service';
import { OpportunityService } from '../../opportunity/services/opportunity.service';
import { AuthService } from '../../auth/services/auth.service';
import { ApplicationResponse } from '../../models/application.model';

describe('NotificationListComponent', () => {
  let component: NotificationListComponent;
  let fixture: ComponentFixture<NotificationListComponent>;
  let candidatureService: jasmine.SpyObj<CandidatureService>;
  let opportunityService: jasmine.SpyObj<OpportunityService>;
  let authService: jasmine.SpyObj<AuthService>;

  const applications: ApplicationResponse[] = [
    {
      id: 'a1', volunteeringId: 'v1', opportunityId: 'opp1',
      status: 'ACCEPTED', appliedAt: '2026-07-01T10:00:00', updatedAt: '2026-07-02T09:00:00'
    },
    {
      id: 'a2', volunteeringId: 'v1', opportunityId: 'opp2',
      status: 'PENDING', appliedAt: '2026-07-03T08:00:00'
    }
  ];

  function setup(auth: { authenticated: boolean; role: string | null }, apps: ApplicationResponse[] = applications): void {
    candidatureService = jasmine.createSpyObj('CandidatureService', ['getVolunteerApplications']);
    opportunityService = jasmine.createSpyObj('OpportunityService', ['getOpportunityById']);
    authService = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'getUserRole']);

    authService.isAuthenticated.and.returnValue(auth.authenticated);
    authService.getUserRole.and.returnValue(auth.role);
    candidatureService.getVolunteerApplications.and.returnValue(of(apps));
    opportunityService.getOpportunityById.and.callFake((id: string) =>
      of({ id, title: id === 'opp1' ? 'Collecte de dons' : 'Soutien scolaire' } as any));

    TestBed.configureTestingModule({
      imports: [NotificationListComponent],
      providers: [
        provideRouter([]),
        { provide: CandidatureService, useValue: candidatureService },
        { provide: OpportunityService, useValue: opportunityService },
        { provide: AuthService, useValue: authService }
      ]
    });

    fixture = TestBed.createComponent(NotificationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  afterEach(() => {
    localStorage.removeItem('notificationsReadIds');
    TestBed.resetTestingModule();
  });

  it('should create', () => {
    setup({ authenticated: false, role: null });
    expect(component).toBeTruthy();
  });

  it('should not load applications when not authenticated', () => {
    setup({ authenticated: false, role: null });
    expect(candidatureService.getVolunteerApplications).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Connectez-vous');
  });

  it('should show organization guidance for organization users', () => {
    setup({ authenticated: true, role: 'ORGANIZATION' });
    expect(candidatureService.getVolunteerApplications).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('candidatures reçues');
  });

  describe('volunteer notifications', () => {
    beforeEach(() => setup({ authenticated: true, role: 'VOLUNTEER' }));

    it('should build one notification for a pending application and two for a decided one', () => {
      // a1 → applied + ACCEPTED ; a2 → applied only
      expect(component.notifications.length).toBe(3);
    });

    it('should include the opportunity title in messages', () => {
      const accepted = component.notifications.find(n => n.id === 'a1-ACCEPTED');
      expect(accepted?.message).toContain('Collecte de dons');
      expect(accepted?.message).toContain('acceptée');
    });

    it('should sort notifications by date descending', () => {
      const dates = component.notifications.map(n => n.date.getTime());
      expect(dates).toEqual([...dates].sort((a, b) => b - a));
    });

    it('should count unread notifications and mark all as read', () => {
      expect(component.unreadCount).toBe(3);
      component.markAllRead();
      expect(component.unreadCount).toBe(0);
    });

    it('should persist read state in localStorage', () => {
      component.markRead(component.notifications[0]);
      const stored = JSON.parse(localStorage.getItem('notificationsReadIds') || '[]');
      expect(stored).toContain(component.notifications[0].id);
    });
  });

  it('should show an empty state when the volunteer has no applications', () => {
    setup({ authenticated: true, role: 'VOLUNTEER' }, []);
    expect(component.notifications.length).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('Aucune notification');
  });

  it('should surface an error message when loading fails', () => {
    candidatureService = jasmine.createSpyObj('CandidatureService', ['getVolunteerApplications']);
    opportunityService = jasmine.createSpyObj('OpportunityService', ['getOpportunityById']);
    authService = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'getUserRole']);

    authService.isAuthenticated.and.returnValue(true);
    authService.getUserRole.and.returnValue('VOLUNTEER');
    candidatureService.getVolunteerApplications.and.returnValue(throwError(() => new Error('Réseau indisponible')));

    TestBed.configureTestingModule({
      imports: [NotificationListComponent],
      providers: [
        provideRouter([]),
        { provide: CandidatureService, useValue: candidatureService },
        { provide: OpportunityService, useValue: opportunityService },
        { provide: AuthService, useValue: authService }
      ]
    });

    fixture = TestBed.createComponent(NotificationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.errorMessage).toContain('Réseau indisponible');
  });
});
