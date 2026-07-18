import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { OpportunityService } from '../services/opportunity.service';
import { AuthService } from '../../auth/services/auth.service';
import { Category } from '../../models/category.model';
import { CreateOpportunityRequest } from '../../models/opportunity.model';
import { ImageUploadService } from '../../shared/services/image-upload.service';

@Component({
  selector: 'app-opportunity-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './opportunity-create.component.html',
  styleUrl: './opportunity-create.component.css'
})
export class OpportunityCreateComponent implements OnInit, OnDestroy {

  opportunityForm!: FormGroup;
  categories: Category[] = [];
  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  readonly maxImages = 3;
  imageUrls: string[] = [];
  isUploadingImage = false;
  imageError = '';

  readonly skillLevels = [
    { value: 'BEGINNER', label: 'Débutant' },
    { value: 'INTERMEDIATE', label: 'Intermédiaire' },
    { value: 'ADVANCED', label: 'Avancé' },
    { value: 'EXPERT', label: 'Expert' }
  ];

  readonly workTypes = [
    { value: 'ON_SITE', label: 'Sur place' },
    { value: 'REMOTE', label: 'À distance' },
    { value: 'HYBRID', label: 'Hybride' }
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private opportunityService: OpportunityService,
    private authService: AuthService,
    private imageUploadService: ImageUploadService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.opportunityForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
      location: ['', Validators.maxLength(255)],
      town: ['', [Validators.required, Validators.maxLength(100)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      requirements: ['', Validators.maxLength(1000)],
      workType: [''],
      volunteersNeeded: [null, [Validators.min(1), Validators.max(1000)]],
      categoryNames: [[], this.minArrayLength(1)],
      skills: this.fb.array([])
    }, { validators: this.dateRangeValidator });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.isUploadingImage) return;

    this.imageError = '';
    if (this.imageUrls.length >= this.maxImages) {
      this.imageError = `Maximum ${this.maxImages} photos par opportunité.`;
      return;
    }

    const validationError = this.imageUploadService.validate(file);
    if (validationError) {
      this.imageError = validationError;
      return;
    }

    this.isUploadingImage = true;
    this.imageUploadService.upload(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.imageUrls = [...this.imageUrls, res.url];
          this.isUploadingImage = false;
        },
        error: (err) => {
          this.imageError = err.message;
          this.isUploadingImage = false;
        }
      });
  }

  removeImage(index: number): void {
    this.imageUrls = this.imageUrls.filter((_, i) => i !== index);
  }

  private dateRangeValidator(group: FormGroup) {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    if (start && end && start > end) {
      return { dateRange: true };
    }
    return null;
  }

  private minArrayLength(min: number) {
    return (control: any) => {
      return control.value?.length >= min ? null : { minLength: true };
    };
  }

  private loadCategories(): void {
    this.isLoading = true;
    this.opportunityService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cats) => {
          this.categories = cats.filter((cat, i, all) => all.findIndex(c => c.name === cat.name) === i);
          this.isLoading = false;
        },
        error: (err) => { this.errorMessage = err.message; this.isLoading = false; }
      });
  }

  get skillsArray(): FormArray {
    return this.opportunityForm.get('skills') as FormArray;
  }

  addSkill(): void {
    this.skillsArray.push(this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      level: ['BEGINNER', Validators.required]
    }));
  }

  removeSkill(i: number): void {
    this.skillsArray.removeAt(i);
  }

  onCategoryChange(catName: string, checked: boolean): void {
    const current: string[] = this.opportunityForm.get('categoryNames')!.value;
    const updated = checked ? [...current, catName] : current.filter(n => n !== catName);
    this.opportunityForm.get('categoryNames')!.setValue(updated);
    this.opportunityForm.get('categoryNames')!.markAsTouched();
  }

  isCategorySelected(catName: string): boolean {
    return this.opportunityForm.get('categoryNames')!.value.includes(catName);
  }

  onSubmit(): void {
    this.markAllTouched();
    if (this.opportunityForm.invalid || this.isSubmitting) {
      this.errorMessage = 'Veuillez corriger les erreurs avant de soumettre.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const v = this.opportunityForm.value;
    const orgId = Number(this.authService.getUserData()?.userId);

    if (!orgId) {
      this.errorMessage = 'Impossible de récupérer votre identifiant organisation. Reconnectez-vous.';
      this.isSubmitting = false;
      return;
    }

    const payload: CreateOpportunityRequest = {
      title: v.title,
      description: v.description,
      location: v.location || undefined,
      town: v.town,
      startDate: v.startDate,
      endDate: v.endDate,
      requirements: v.requirements || undefined,
      orgId,
      categoryNames: v.categoryNames,
      skillNames: (v.skills as { name: string; level: string }[]).map(s => s.name).filter(Boolean),
      workType: v.workType || undefined,
      volunteersNeeded: v.volunteersNeeded || undefined,
      imageUrls: this.imageUrls.length ? this.imageUrls : undefined
    };

    this.opportunityService.createOpportunity(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.successMessage = 'Opportunité créée avec succès !';
          setTimeout(() => this.router.navigate(['/volunteering/opportunities/my']), 1500);
        },
        error: (err) => {
          this.isSubmitting = false;
          this.errorMessage = err.message || 'Erreur lors de la création.';
        }
      });
  }

  private markAllTouched(): void {
    this.opportunityForm.markAllAsTouched();
    this.skillsArray.controls.forEach(c => (c as FormGroup).markAllAsTouched());
  }

  onCancel(): void {
    this.router.navigate(['/volunteering/opportunities/my']);
  }

  hasError(field: string, error: string): boolean {
    const c = this.opportunityForm.get(field);
    return !!(c?.hasError(error) && c.touched);
  }

  get dateRangeError(): boolean {
    return !!(this.opportunityForm.hasError('dateRange') &&
      this.opportunityForm.get('endDate')?.touched);
  }
}
