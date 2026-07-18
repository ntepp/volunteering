import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, switchMap, takeUntil } from 'rxjs';

import { OrgProfileService } from '../services/org-profile.service';
import { AuthService } from '../../auth/services/auth.service';
import { OrgProfileDto } from '../../models/org-profile.model';
import { ImageUploadService } from '../../shared/services/image-upload.service';
import { OpportunityService } from '../../opportunity/services/opportunity.service';
import { OpportunityResponseDto } from '../../models/opportunity.model';
import { OpportunityCardComponent } from '../../shared/opportunity-card/opportunity-card.component';

@Component({
  selector: 'app-org-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, OpportunityCardComponent],
  templateUrl: './org-profile.component.html',
  styleUrl: './org-profile.component.css'
})
export class OrgProfileComponent implements OnInit, OnDestroy {

  profile: OrgProfileDto | null = null;
  profileForm!: FormGroup;

  isLoading = true;
  isEditing = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  orgId = '';
  isMyProfile = false;

  isUploadingAvatar = false;
  avatarError = '';

  opportunities: OpportunityResponseDto[] = [];
  opportunitiesTotal = 0;
  isLoadingOpportunities = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private orgProfileService: OrgProfileService,
    private authService: AuthService,
    private imageUploadService: ImageUploadService,
    private opportunityService: OpportunityService
  ) {}

  ngOnInit(): void {
    this.orgId = this.route.snapshot.paramMap.get('id') ?? '';
    this.initForm();
    this.loadProfile();
    this.loadOpportunities();
  }

  private loadOpportunities(): void {
    const orgId = Number(this.orgId);
    if (!orgId) return;

    this.isLoadingOpportunities = true;
    this.opportunityService.getOpportunitiesByOrgId(orgId, 0, 6)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          this.opportunities = page.opportunities ?? [];
          this.opportunitiesTotal = page.totalItems ?? this.opportunities.length;
          this.isLoadingOpportunities = false;
        },
        error: () => { this.isLoadingOpportunities = false; }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      orgName: ['', Validators.maxLength(200)],
      missionStatement: ['', Validators.maxLength(500)],
      about: ['', Validators.maxLength(2000)],
      city: ['', Validators.maxLength(100)],
      country: ['', Validators.maxLength(100)]
    });
  }

  private loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.orgProfileService.getOrgById(this.orgId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (p) => {
          this.profile = p;
          this.profileForm.patchValue({
            orgName: p.orgName ?? '',
            missionStatement: p.missionStatement ?? '',
            about: p.about ?? '',
            city: p.city ?? '',
            country: p.country ?? ''
          });
          this.checkIsMyProfile(p);
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.message;
          this.isLoading = false;
        }
      });
  }

  private checkIsMyProfile(p: OrgProfileDto): void {
    const userData = this.authService.getUserData();
    const role = this.authService.getUserRole();
    if (role === 'ORGANIZATION' && userData?.userId != null) {
      this.isMyProfile = String(userData.userId) === String(this.orgId) ||
                         (p.id != null && String(userData.userId) === String(p.id));
    }
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
        switchMap(res => this.orgProfileService.updateMyProfile({ profileImage: res.url }))
      )
      .subscribe({
        next: (updated) => {
          this.profile = updated;
          this.isUploadingAvatar = false;
          this.successMessage = 'Logo mis à jour !';
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
    if (this.profile) {
      this.profileForm.patchValue({
        orgName: this.profile.orgName ?? '',
        missionStatement: this.profile.missionStatement ?? '',
        about: this.profile.about ?? '',
        city: this.profile.city ?? '',
        country: this.profile.country ?? ''
      });
    }
  }

  onSave(): void {
    if (this.profileForm.invalid || this.isSaving) return;

    this.isSaving = true;
    this.errorMessage = '';

    const v = this.profileForm.value;
    this.orgProfileService.updateMyProfile({
      orgName: v.orgName || undefined,
      missionStatement: v.missionStatement || undefined,
      about: v.about || undefined,
      city: v.city || undefined,
      country: v.country || undefined
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
        error: (err) => {
          this.errorMessage = err.message;
          this.isSaving = false;
        }
      });
  }
}
