import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { OpportunityService } from '../services/opportunity.service';
import { CandidatureService } from '../services/candidature.service';
import { AuthService } from '../../auth/services/auth.service';
import { ApplicationStatus } from '../../models/application.model';

@Component({
  selector: 'app-opportunity-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './opportunity-detail.component.html',
  styleUrls: ['./opportunity-detail.component.css']
})
export class OpportunityDetailComponent implements OnInit, OnDestroy {

  opportunity: any = null;
  isLoading = false;
  isApplying = false;
  hasApplied = false;
  applicationStatus: ApplicationStatus | null = null;
  errorMessage = '';
  successMessage = '';

  // Motivation form state
  showMotivationForm = false;
  motivationText = '';

  // Galerie photos
  selectedImage: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private opportunityService: OpportunityService,
    private candidatureService: CandidatureService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadOpportunity();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOpportunity(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'ID d\'opportunité manquant';
      this.isLoading = false;
      return;
    }

    this.opportunityService.getOpportunityById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (opp) => {
          this.opportunity = opp;
          this.isLoading = false;
          this.checkExistingApplication();
        },
        error: (err) => {
          this.errorMessage = err.message || 'Impossible de charger cette opportunité';
          this.isLoading = false;
        }
      });
  }

  private checkExistingApplication(): void {
    const user = this.authService.getUserData();
    if (!user || !this.opportunity?.id) return;

    this.candidatureService.getVolunteerApplications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (apps) => {
          const existing = apps.find(a => a.opportunityId === this.opportunity?.id);
          if (existing) {
            this.hasApplied = true;
            this.applicationStatus = existing.status;
          }
        },
        error: () => {}
      });
  }

  openMotivationForm(): void {
    const user = this.authService.getUserData();
    if (!user) {
      this.errorMessage = 'Vous devez être connecté pour postuler.';
      return;
    }
    this.showMotivationForm = true;
    this.errorMessage = '';
  }

  cancelMotivation(): void {
    this.showMotivationForm = false;
    this.motivationText = '';
  }

  confirmApply(): void {
    if (!this.opportunity?.id || this.isApplying || this.hasApplied) return;

    const user = this.authService.getUserData();
    if (!user) {
      this.errorMessage = 'Vous devez être connecté pour postuler.';
      return;
    }

    this.isApplying = true;
    this.errorMessage = '';

    this.candidatureService.applyToOpportunity(
      this.opportunity.id,
      user.userId!.toString(),
      this.motivationText || undefined
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isApplying = false;
          this.hasApplied = true;
          this.applicationStatus = 'PENDING';
          this.showMotivationForm = false;
          this.motivationText = '';
          this.successMessage = 'Votre candidature a été soumise avec succès !';
        },
        error: (err) => {
          this.isApplying = false;
          this.showMotivationForm = false;
          this.errorMessage = err.message || 'Erreur lors de la candidature.';
        }
      });
  }

  statusLabel(status: ApplicationStatus): string {
    const labels: Record<ApplicationStatus, string> = {
      PENDING: 'En attente',
      VIEW: 'Consultée',
      ACCEPTED: 'Acceptée',
      REJECTED: 'Rejetée',
      CLOSED: 'Fermée'
    };
    return labels[status] ?? status;
  }

  statusClass(status: ApplicationStatus): string {
    const classes: Record<ApplicationStatus, string> = {
      PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
      VIEW: 'bg-sky-50 text-sky-700 border-sky-200',
      ACCEPTED: 'bg-green-50 text-green-700 border-green-200',
      REJECTED: 'bg-red-50 text-red-700 border-red-200',
      CLOSED: 'bg-slate-50 text-slate-500 border-slate-200'
    };
    return classes[status] ?? 'bg-slate-50 text-slate-500 border-slate-200';
  }

  get isOrganization(): boolean {
    return this.authService.getUserData()?.role === 'ORGANIZATION';
  }

  onBackToList(): void {
    this.router.navigate(['/volunteering/opportunities']);
  }
}
