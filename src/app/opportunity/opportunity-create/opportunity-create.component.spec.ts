import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { OpportunityCreateComponent } from './opportunity-create.component';
import { OpportunityService } from '../services/opportunity.service';
import { Category } from '../../models/category.model';

describe('OpportunityCreateComponent', () => {
  let component: OpportunityCreateComponent;
  let fixture: ComponentFixture<OpportunityCreateComponent>;
  let mockOpportunityService: jasmine.SpyObj<OpportunityService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockCategories: Category[] = [
    { id: '1', name: 'Santé' },
    { id: '2', name: 'Éducation' },
    { id: '3', name: 'Environnement' }
  ];

  beforeEach(async () => {
    const opportunityServiceSpy = jasmine.createSpyObj('OpportunityService', ['getCategories', 'createOpportunity']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        OpportunityCreateComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatChipsModule,
        MatIconModule,
        MatCardModule,
        MatDividerModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatCheckboxModule,
        MatTooltipModule
      ],
      providers: [
        { provide: OpportunityService, useValue: opportunityServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    mockOpportunityService = TestBed.inject(OpportunityService) as jasmine.SpyObj<OpportunityService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OpportunityCreateComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    component.ngOnInit();
    
    expect(component.opportunityForm).toBeDefined();
    expect(component.opportunityForm.get('title')?.value).toBe('');
    expect(component.opportunityForm.get('description')?.value).toBe('');
    expect(component.opportunityForm.get('location')?.value).toBe('');
    expect(component.opportunityForm.get('town')?.value).toBe('');
    expect(component.opportunityForm.get('startDate')?.value).toBe('');
    expect(component.opportunityForm.get('endDate')?.value).toBe('');
    expect(component.opportunityForm.get('requirements')?.value).toBe('');
    expect(component.opportunityForm.get('categories')?.value).toEqual([]);
  });

  it('should load categories on init', () => {
    mockOpportunityService.getCategories.and.returnValue(of(mockCategories));
    
    component.ngOnInit();
    
    expect(mockOpportunityService.getCategories).toHaveBeenCalled();
    expect(component.categories).toEqual(mockCategories);
    expect(component.isLoading).toBeFalse();
  });

  it('should handle error when loading categories', () => {
    const errorMessage = 'Erreur de chargement';
    mockOpportunityService.getCategories.and.returnValue(throwError(() => new Error(errorMessage)));
    
    component.ngOnInit();
    
    expect(component.errorMessage).toContain(errorMessage);
    expect(component.isLoading).toBeFalse();
  });

  it('should add skill to form array', () => {
    component.ngOnInit();
    const initialLength = component.skillsRequiredArray.length;
    
    component.addSkill();
    
    expect(component.skillsRequiredArray.length).toBe(initialLength + 1);
  });

  it('should remove skill from form array', () => {
    component.ngOnInit();
    component.addSkill();
    component.addSkill();
    const initialLength = component.skillsRequiredArray.length;
    
    component.removeSkill(0);
    
    expect(component.skillsRequiredArray.length).toBe(initialLength - 1);
  });

  it('should validate required fields', () => {
    component.ngOnInit();
    
    expect(component.opportunityForm.valid).toBeFalse();
    
    component.opportunityForm.patchValue({
      title: 'Test Opportunity',
      description: 'This is a test opportunity description with enough characters',
      location: 'Test Location',
      town: 'Test Town',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      categories: [mockCategories[0]]
    });
    
    expect(component.opportunityForm.valid).toBeTrue();
  });

  it('should validate date range', () => {
    component.ngOnInit();
    
    component.opportunityForm.patchValue({
      startDate: '2024-01-31',
      endDate: '2024-01-01'
    });
    
    expect(component.opportunityForm.get('endDate')?.hasError('invalidDateRange')).toBeTrue();
  });

  it('should navigate back on cancel', () => {
    component.onCancel();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/opportunities']);
  });

  it('should show error message for invalid form submission', () => {
    component.ngOnInit();
    
    component.onSubmit();
    
    expect(component.errorMessage).toBe('Veuillez corriger les erreurs dans le formulaire.');
  });

  it('should handle successful form submission', () => {
    component.ngOnInit();
    mockOpportunityService.createOpportunity.and.returnValue(of({}));
    
    component.opportunityForm.patchValue({
      title: 'Test Opportunity',
      description: 'This is a test opportunity description with enough characters',
      location: 'Test Location',
      town: 'Test Town',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      categories: [mockCategories[0]]
    });
    
    component.onSubmit();
    
    expect(mockOpportunityService.createOpportunity).toHaveBeenCalled();
    expect(component.isSubmitting).toBeFalse();
  });

  it('should handle error during form submission', () => {
    component.ngOnInit();
    const errorMessage = 'Erreur de création';
    mockOpportunityService.createOpportunity.and.returnValue(throwError(() => new Error(errorMessage)));
    
    component.opportunityForm.patchValue({
      title: 'Test Opportunity',
      description: 'This is a test opportunity description with enough characters',
      location: 'Test Location',
      town: 'Test Town',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      categories: [mockCategories[0]]
    });
    
    component.onSubmit();
    
    expect(component.errorMessage).toBe(errorMessage);
    expect(component.isSubmitting).toBeFalse();
  });

  it('should have correct skill levels', () => {
    expect(component.skillLevels).toEqual([
      { value: 'BEGINNER', label: 'Débutant' },
      { value: 'INTERMEDIATE', label: 'Intermédiaire' },
      { value: 'ADVANCED', label: 'Avancé' },
      { value: 'EXPERT', label: 'Expert' }
    ]);
  });

  it('should clean up subscriptions on destroy', () => {
    component.ngOnInit();
    const destroySpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });
});
