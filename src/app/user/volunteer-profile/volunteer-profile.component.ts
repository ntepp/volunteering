import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, switchMap, takeUntil } from 'rxjs';

import { VolunteerProfileService, VolunteerProfile } from '../services/volunteer-profile.service';
import { OpportunityService } from '../../opportunity/services/opportunity.service';
import { Category } from '../../models/category.model';
import { ImageUploadService } from '../../shared/services/image-upload.service';

@Component({
  selector: 'app-volunteer-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './volunteer-profile.component.html',
  styleUrl: './volunteer-profile.component.css'
})
export class VolunteerProfileComponent implements OnInit, OnDestroy {

  profile: VolunteerProfile | null = null;
  profileForm!: FormGroup;
  categories: Category[] = [];

  isLoading = false;
  isSaving = false;
  isEditing = false;
  errorMessage = '';
  successMessage = '';

  isUploadingAvatar = false;
  avatarError = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private profileService: VolunteerProfileService,
    private opportunityService: OpportunityService,
    private imageUploadService: ImageUploadService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadProfile();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.maxLength(100)],
      lastName: ['', Validators.maxLength(100)],
      bio: ['', Validators.maxLength(500)],
      city: ['', Validators.maxLength(100)],
      country: ['', Validators.maxLength(100)],
      phone: ['', Validators.maxLength(20)],
      preferredCategories: [[]]
    });
  }

  private loadProfile(): void {
    this.isLoading = true;
    this.profileService.getMyProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (p) => {
          this.profile = p;
          this.profileForm.patchValue({
            firstName: p.firstName ?? '',
            lastName: p.lastName ?? '',
            bio: p.bio ?? '',
            city: p.city ?? '',
            country: p.country ?? '',
            preferredCategories: p.preferredCategories ?? []
          });
          this.isLoading = false;
        },
        error: (err) => { this.errorMessage = err.message; this.isLoading = false; }
      });
  }

  private loadCategories(): void {
    this.opportunityService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cats) => {
          this.categories = cats.filter((cat, i, all) => all.findIndex(c => c.name === cat.name) === i);
        },
        error: () => {}
      });
  }

  get selectedCategories(): string[] {
    return this.profileForm.get('preferredCategories')!.value as string[];
  }

  onCategoryChange(name: string, checked: boolean): void {
    const current = this.selectedCategories;
    const updated = checked ? [...current, name] : current.filter(n => n !== name);
    this.profileForm.get('preferredCategories')!.setValue(updated);
  }

  isCategorySelected(name: string): boolean {
    return this.selectedCategories.includes(name);
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.isUploadingAvatar) return;

    this.avatarError = '';
    const validationError = this.imageUploadService.validate(file);
    if (validationError) {
      this.avatarError = validationError;
      return;
    }

    this.isUploadingAvatar = true;
    this.imageUploadService.upload(file)
      .pipe(
        takeUntil(this.destroy$),
        switchMap(res => this.profileService.updateMyProfile({ profileImage: res.url }))
      )
      .subscribe({
        next: (updated) => {
          this.profile = updated;
          this.isUploadingAvatar = false;
          this.successMessage = 'Photo de profil mise à jour !';
          setTimeout(() => { this.successMessage = ''; }, 3000);
        },
        error: (err) => {
          this.avatarError = err.message;
          this.isUploadingAvatar = false;
        }
      });
  }

  startEditing(): void {
    this.isEditing = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelEditing(): void {
    this.isEditing = false;
    // Reset form to current profile values
    if (this.profile) {
      this.profileForm.patchValue({
        firstName: this.profile.firstName ?? '',
        lastName: this.profile.lastName ?? '',
        bio: this.profile.bio ?? '',
        city: this.profile.city ?? '',
        country: this.profile.country ?? '',
        preferredCategories: this.profile.preferredCategories ?? []
      });
    }
  }

  onSave(): void {
    if (this.profileForm.invalid || this.isSaving) return;

    this.isSaving = true;
    this.errorMessage = '';

    const v = this.profileForm.value;
    this.profileService.updateMyProfile({
      firstName: v.firstName || undefined,
      lastName: v.lastName || undefined,
      bio: v.bio || undefined,
      city: v.city || undefined,
      country: v.country || undefined,
      phone: v.phone || undefined,
      preferredCategories: v.preferredCategories
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.profile = updated;
          this.isSaving = false;
          this.isEditing = false;
          this.successMessage = 'Profil mis à jour avec succès !';
          setTimeout(() => { this.successMessage = ''; }, 3000);
        },
        error: (err) => { this.errorMessage = err.message; this.isSaving = false; }
      });
  }
}
