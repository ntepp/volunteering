import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { OrgProfileComponent } from './org-profile.component';
import { OrgProfileService } from '../services/org-profile.service';
import { AuthService } from '../../auth/services/auth.service';
import { OrgProfileDto } from '../../models/org-profile.model';

const mockProfile: OrgProfileDto = {
  id: 5,
  orgName: 'Croix-Rouge Française',
  missionStatement: 'Venir en aide aux personnes vulnérables.',
  about: 'Organisation humanitaire fondée en 1864.',
  verifiedBadge: true,
  completenessScore: 80,
  city: 'Paris',
  country: 'France'
};

describe('OrgProfileComponent', () => {
  let component: OrgProfileComponent;
  let fixture: ComponentFixture<OrgProfileComponent>;
  let mockOrgProfileService: jasmine.SpyObj<OrgProfileService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  function createComponent(id: string | null, authSetup?: () => void) {
    return TestBed.configureTestingModule({
      imports: [OrgProfileComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => id } } }
        },
        { provide: OrgProfileService, useValue: mockOrgProfileService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents().then(() => {
      if (authSetup) { authSetup(); }
      fixture = TestBed.createComponent(OrgProfileComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });
  }

  beforeEach(() => {
    mockOrgProfileService = jasmine.createSpyObj('OrgProfileService', [
      'getOrgById', 'updateMyProfile'
    ]);
    mockAuthService = jasmine.createSpyObj('AuthService', [
      'getUserData', 'getUserRole'
    ]);
    mockAuthService.getUserData.and.returnValue(null);
    mockAuthService.getUserRole.and.returnValue(null);
  });

  // --- Création du composant ---

  it('should create', async () => {
    mockOrgProfileService.getOrgById.and.returnValue(of(mockProfile));
    await createComponent('5');
    expect(component).toBeTruthy();
  });

  // --- Affichage du profil chargé ---

  it('should display the loaded profile data', async () => {
    mockOrgProfileService.getOrgById.and.returnValue(of(mockProfile));
    await createComponent('5');

    expect(component.profile).toEqual(mockProfile);
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Croix-Rouge Française');
    expect(compiled.textContent).toContain('Venir en aide aux personnes vulnérables.');
    expect(compiled.textContent).toContain('Organisation humanitaire fondée en 1864.');
  });

  it('should display the verified badge when verifiedBadge is true', async () => {
    mockOrgProfileService.getOrgById.and.returnValue(of(mockProfile));
    await createComponent('5');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Vérifié');
  });

  it('should not display the verified badge when verifiedBadge is false', async () => {
    const unverified: OrgProfileDto = { ...mockProfile, verifiedBadge: false };
    mockOrgProfileService.getOrgById.and.returnValue(of(unverified));
    await createComponent('5');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Vérifié');
  });

  it('should display the city and country', async () => {
    mockOrgProfileService.getOrgById.and.returnValue(of(mockProfile));
    await createComponent('5');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Paris');
    expect(compiled.textContent).toContain('France');
  });

  it('should fallback to "Organisation" when orgName is missing', async () => {
    const noName: OrgProfileDto = { ...mockProfile, orgName: undefined };
    mockOrgProfileService.getOrgById.and.returnValue(of(noName));
    await createComponent('5');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Organisation');
  });

  // --- Gestion erreur 404 ---

  it('should display error message on API failure (404)', async () => {
    mockOrgProfileService.getOrgById.and.returnValue(
      throwError(() => new Error('Organisation introuvable.'))
    );
    await createComponent('999');

    expect(component.profile).toBeNull();
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBe('Organisation introuvable.');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Organisation introuvable.');
  });

  // --- Mode édition (isMyProfile = true) ---

  it('should show the edit button when isMyProfile is true', async () => {
    mockOrgProfileService.getOrgById.and.returnValue(of(mockProfile));
    mockAuthService.getUserRole.and.returnValue('ORGANIZATION');
    mockAuthService.getUserData.and.returnValue({ user: 'org@test.com', role: 'ORGANIZATION', userId: '5' });

    await createComponent('5');

    expect(component.isMyProfile).toBeTrue();

    const compiled = fixture.nativeElement as HTMLElement;
    const editButton = compiled.querySelector('button');
    expect(editButton?.textContent).toContain('Modifier');
  });

  it('should NOT show the edit button when isMyProfile is false', async () => {
    mockOrgProfileService.getOrgById.and.returnValue(of(mockProfile));
    mockAuthService.getUserRole.and.returnValue('VOLUNTEER');
    mockAuthService.getUserData.and.returnValue({ user: 'vol@test.com', role: 'VOLUNTEER', userId: '99' });

    await createComponent('5');

    expect(component.isMyProfile).toBeFalse();

    const compiled = fixture.nativeElement as HTMLElement;
    const editButton = compiled.querySelector('button');
    expect(editButton).toBeNull();
  });

  it('should enter edit mode on startEditing()', async () => {
    mockOrgProfileService.getOrgById.and.returnValue(of(mockProfile));
    mockAuthService.getUserRole.and.returnValue('ORGANIZATION');
    mockAuthService.getUserData.and.returnValue({ user: 'org@test.com', role: 'ORGANIZATION', userId: '5' });

    await createComponent('5');

    component.startEditing();
    fixture.detectChanges();

    expect(component.isEditing).toBeTrue();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('form')).toBeTruthy();
  });

  it('should cancel edit mode on cancelEditing()', async () => {
    mockOrgProfileService.getOrgById.and.returnValue(of(mockProfile));
    mockAuthService.getUserRole.and.returnValue('ORGANIZATION');
    mockAuthService.getUserData.and.returnValue({ user: 'org@test.com', role: 'ORGANIZATION', userId: '5' });

    await createComponent('5');

    component.startEditing();
    component.cancelEditing();
    fixture.detectChanges();

    expect(component.isEditing).toBeFalse();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('form')).toBeNull();
  });

  // --- Sauvegarde ---

  it('should call updateMyProfile and update profile on save', async () => {
    mockOrgProfileService.getOrgById.and.returnValue(of(mockProfile));
    mockAuthService.getUserRole.and.returnValue('ORGANIZATION');
    mockAuthService.getUserData.and.returnValue({ user: 'org@test.com', role: 'ORGANIZATION', userId: '5' });

    const updatedProfile: OrgProfileDto = { ...mockProfile, orgName: 'Nouvelle Organisation' };
    mockOrgProfileService.updateMyProfile.and.returnValue(of(updatedProfile));

    await createComponent('5');

    component.startEditing();
    component.profileForm.patchValue({ orgName: 'Nouvelle Organisation' });
    component.onSave();

    expect(mockOrgProfileService.updateMyProfile).toHaveBeenCalled();
    expect(component.profile?.orgName).toBe('Nouvelle Organisation');
    expect(component.isEditing).toBeFalse();
    expect(component.successMessage).toBe('Profil mis à jour avec succès !');
  });

  it('should set errorMessage when updateMyProfile fails', async () => {
    mockOrgProfileService.getOrgById.and.returnValue(of(mockProfile));
    mockAuthService.getUserRole.and.returnValue('ORGANIZATION');
    mockAuthService.getUserData.and.returnValue({ user: 'org@test.com', role: 'ORGANIZATION', userId: '5' });

    mockOrgProfileService.updateMyProfile.and.returnValue(
      throwError(() => new Error('Erreur serveur'))
    );

    await createComponent('5');

    component.startEditing();
    component.onSave();

    expect(component.errorMessage).toBe('Erreur serveur');
    expect(component.isSaving).toBeFalse();
  });

  // --- Spinner de chargement ---

  it('should show loading spinner initially before data arrives', async () => {
    const { Subject } = await import('rxjs');
    const pending$ = new Subject<OrgProfileDto>();
    mockOrgProfileService.getOrgById.and.returnValue(pending$.asObservable());

    await TestBed.configureTestingModule({
      imports: [OrgProfileComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '5' } } }
        },
        { provide: OrgProfileService, useValue: mockOrgProfileService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrgProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoading).toBeTrue();
    expect(component.profile).toBeNull();

    const compiled = fixture.nativeElement as HTMLElement;
    const spinner = compiled.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();

    pending$.complete();
  });

  // --- Lifecycle ---

  it('should complete destroy$ on ngOnDestroy', async () => {
    mockOrgProfileService.getOrgById.and.returnValue(of(mockProfile));
    await createComponent('5');

    const completeSpy = spyOn((component as any).destroy$, 'complete').and.callThrough();
    component.ngOnDestroy();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should call getOrgById with the id from route params', async () => {
    mockOrgProfileService.getOrgById.and.returnValue(of(mockProfile));
    await createComponent('5');

    expect(mockOrgProfileService.getOrgById).toHaveBeenCalledWith('5');
  });

  // --- Barre de progression (completenessScore) ---

  it('should show completeness score bar when isMyProfile is true', async () => {
    mockOrgProfileService.getOrgById.and.returnValue(of(mockProfile));
    mockAuthService.getUserRole.and.returnValue('ORGANIZATION');
    mockAuthService.getUserData.and.returnValue({ user: 'org@test.com', role: 'ORGANIZATION', userId: '5' });

    await createComponent('5');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('80%');
  });

  it('should NOT show completeness score bar when isMyProfile is false', async () => {
    mockOrgProfileService.getOrgById.and.returnValue(of(mockProfile));
    mockAuthService.getUserRole.and.returnValue(null);
    mockAuthService.getUserData.and.returnValue(null);

    await createComponent('5');

    expect(component.isMyProfile).toBeFalse();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Complétude du profil');
  });
});
