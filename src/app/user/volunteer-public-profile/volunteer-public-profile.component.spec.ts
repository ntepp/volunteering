import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { VolunteerPublicProfileComponent } from './volunteer-public-profile.component';
import { VolunteerProfileService, VolunteerProfile } from '../services/volunteer-profile.service';

const mockProfile: VolunteerProfile = {
  id: 1,
  username: 'jdoe',
  firstName: 'Jane',
  lastName: 'Doe',
  bio: 'Passionate volunteer',
  city: 'Paris',
  country: 'France',
  preferredCategories: ['Environnement', 'Education']
};

describe('VolunteerPublicProfileComponent', () => {
  let component: VolunteerPublicProfileComponent;
  let fixture: ComponentFixture<VolunteerPublicProfileComponent>;
  let mockProfileService: jasmine.SpyObj<VolunteerProfileService>;

  function createComponent(username: string | null, serviceSetup?: () => void) {
    return TestBed.configureTestingModule({
      imports: [VolunteerPublicProfileComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: () => username } }
          }
        },
        { provide: VolunteerProfileService, useValue: mockProfileService }
      ]
    }).compileComponents().then(() => {
      if (serviceSetup) { serviceSetup(); }
      fixture = TestBed.createComponent(VolunteerPublicProfileComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });
  }

  beforeEach(() => {
    mockProfileService = jasmine.createSpyObj('VolunteerProfileService', [
      'getPublicProfile', 'getMyProfile', 'updateMyProfile'
    ]);
  });

  it('should create', async () => {
    mockProfileService.getPublicProfile.and.returnValue(of(mockProfile));
    await createComponent('jdoe');
    expect(component).toBeTruthy();
  });

  it('should display loaded profile data', async () => {
    mockProfileService.getPublicProfile.and.returnValue(of(mockProfile));
    await createComponent('jdoe');

    expect(component.profile).toEqual(mockProfile);
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Jane');
    expect(compiled.textContent).toContain('Doe');
    expect(compiled.textContent).toContain('@jdoe');
  });

  it('should display error message when API call fails', async () => {
    mockProfileService.getPublicProfile.and.returnValue(
      throwError(() => new Error('Profil introuvable.'))
    );
    await createComponent('unknown');

    expect(component.profile).toBeNull();
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('Profil introuvable.');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Profil introuvable.');
  });

  it('should show loading spinner initially before data arrives', async () => {
    // Use a never-resolving observable to keep isLoading = true
    const { Subject } = await import('rxjs');
    const pending$ = new Subject<VolunteerProfile>();
    mockProfileService.getPublicProfile.and.returnValue(pending$.asObservable());

    await TestBed.configureTestingModule({
      imports: [VolunteerPublicProfileComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'jdoe' } } }
        },
        { provide: VolunteerProfileService, useValue: mockProfileService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VolunteerPublicProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoading).toBeTrue();
    expect(component.profile).toBeNull();

    const compiled = fixture.nativeElement as HTMLElement;
    const spinner = compiled.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();

    pending$.complete();
  });

  it('should display anonymous label when firstName and lastName are missing', async () => {
    const anonymousProfile: VolunteerProfile = { id: 2, username: 'anon42' };
    mockProfileService.getPublicProfile.and.returnValue(of(anonymousProfile));
    await createComponent('anon42');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Bénévole anonyme');
    expect(compiled.textContent).toContain('@anon42');
  });

  it('should call getPublicProfile with the username from route params', async () => {
    mockProfileService.getPublicProfile.and.returnValue(of(mockProfile));
    await createComponent('jdoe');

    expect(mockProfileService.getPublicProfile).toHaveBeenCalledWith('jdoe');
  });

  it('should complete destroy$ on ngOnDestroy', async () => {
    mockProfileService.getPublicProfile.and.returnValue(of(mockProfile));
    await createComponent('jdoe');

    const completeSpy = spyOn((component as any).destroy$, 'complete').and.callThrough();
    component.ngOnDestroy();
    expect(completeSpy).toHaveBeenCalled();
  });
});
