import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { HeaderComponent } from './header.component';
import { AuthService } from '../../auth/services/auth.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authSubject: BehaviorSubject<boolean>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  function setup(authenticated: boolean, role: string | null) {
    authSubject = new BehaviorSubject<boolean>(authenticated);
    mockAuthService = jasmine.createSpyObj('AuthService', ['getUserRole', 'logout', 'isAuthenticated', 'getUserData']);
    (mockAuthService as any).isAuthenticated$ = authSubject.asObservable();
    mockAuthService.getUserRole.and.returnValue(role);
    mockAuthService.getUserData.and.returnValue(null);
  }

  async function createComponent() {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    setup(false, null);
    await createComponent();
    expect(component).toBeTruthy();
  });

  it('should show volunteer links when role is VOLUNTEER', async () => {
    setup(true, 'VOLUNTEER');
    await createComponent();
    expect(component.isVolunteer).toBeTrue();
    expect(component.isOrganization).toBeFalse();
  });

  it('should show organization links when role is ORGANIZATION', async () => {
    setup(true, 'ORGANIZATION');
    await createComponent();
    expect(component.isOrganization).toBeTrue();
    expect(component.isVolunteer).toBeFalse();
  });

  it('should be unauthenticated when not logged in', async () => {
    setup(false, null);
    await createComponent();
    expect(component.isAuthenticated).toBeFalse();
    expect(component.userRole).toBeNull();
  });

  it('should update state reactively on auth change', async () => {
    setup(false, null);
    await createComponent();
    expect(component.isAuthenticated).toBeFalse();

    mockAuthService.getUserRole.and.returnValue('VOLUNTEER');
    authSubject.next(true);
    fixture.detectChanges();

    expect(component.isAuthenticated).toBeTrue();
    expect(component.isVolunteer).toBeTrue();
  });
});
