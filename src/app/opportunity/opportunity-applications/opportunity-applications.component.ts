import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, forkJoin, of, takeUntil } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { CandidatureService } from '../services/candidature.service';
import { OpportunityService } from '../services/opportunity.service';
import { VolunteerProfile, VolunteerProfileService } from '../../user/services/volunteer-profile.service';
import { ApplicationResponse, ApplicationStatus } from '../../models/application.model';

@Component({
  selector: 'app-opportunity-applications',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './opportunity-applications.component.html',
  styleUrl: './opportunity-applications.component.css'
})
export class OpportunityApplicationsComponent implements OnInit, OnDestroy {

  opportunityId = '';
  opportunityTitle = '';
  volunteersNeeded: number | null = null;
  applications: ApplicationResponse[] = [];
  volunteerProfiles = new Map<string, VolunteerProfile>();
  isLoading = false;
  errorMessage = '';
  updatingId: number | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private candidatureService: CandidatureService,
    private opportunityService: OpportunityService,
    private volunteerProfileService: VolunteerProfileService
  ) {}

  ngOnInit(): void {
    this.opportunityId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadTitle();
    this.loadApplications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTitle(): void {
    this.opportunityService.getOpportunityById(this.opportunityId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (opp: any) => {
          this.opportunityTitle = opp.title ?? '';
          this.volunteersNeeded = opp.volunteersNeeded ?? null;
        },
        error: () => {}
      });
  }

  // ── Métriques du tableau de bord ──────────────────────────────────────────

  countByStatus(status: ApplicationStatus): number {
    return this.applications.filter(a => a.status === status).length;
  }

  get totalCount(): number {
    return this.applications.length;
  }

  get pendingCount(): number {
    return this.countByStatus('PENDING');
  }

  get acceptedCount(): number {
    return this.countByStatus('ACCEPTED');
  }

  /** Candidatures reçues au cours des 7 derniers jours. */
  get recentCount(): number {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return this.applications.filter(a => new Date(a.appliedAt).getTime() >= weekAgo).length;
  }

  /** Part des candidatures déjà traitées (tout sauf "En attente"), en %. */
  get processedPercent(): number {
    if (!this.totalCount) return 0;
    return Math.round(((this.totalCount - this.pendingCount) / this.totalCount) * 100);
  }

  /** Places pourvues vs bénévoles recherchés, en % (plafonné à 100). */
  get filledPercent(): number {
    if (!this.volunteersNeeded) return 0;
    return Math.min(100, Math.round((this.acceptedCount / this.volunteersNeeded) * 100));
  }

  /** Segments non vides pour la barre de répartition par statut. */
  get statusSegments(): { status: ApplicationStatus; label: string; count: number; percent: number; barClass: string; dotClass: string }[] {
    const bar: Record<ApplicationStatus, string> = {
      PENDING: 'bg-amber-400',
      VIEW: 'bg-sky-400',
      ACCEPTED: 'bg-green-500',
      REJECTED: 'bg-red-400',
      CLOSED: 'bg-slate-300'
    };
    const order: ApplicationStatus[] = ['ACCEPTED', 'VIEW', 'PENDING', 'REJECTED', 'CLOSED'];
    return order
      .map(status => ({
        status,
        label: this.statusLabel(status),
        count: this.countByStatus(status),
        percent: this.totalCount ? (this.countByStatus(status) / this.totalCount) * 100 : 0,
        barClass: bar[status],
        dotClass: bar[status]
      }))
      .filter(s => s.count > 0);
  }

  private loadApplications(): void {
    this.isLoading = true;
    this.candidatureService.getOpportunityApplications(this.opportunityId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (apps) => {
          this.applications = apps;
          this.isLoading = false;
          this.loadVolunteerProfiles(apps);
        },
        error: (err) => { this.errorMessage = err.message; this.isLoading = false; }
      });
  }

  /** Résout les profils des candidats — les candidatures ne portent que leur id. */
  private loadVolunteerProfiles(apps: ApplicationResponse[]): void {
    const ids = [...new Set(apps.map(a => a.volunteeringId).filter(Boolean))];
    if (!ids.length) return;

    const lookups = ids.map(id =>
      this.volunteerProfileService.getPublicProfileById(id).pipe(
        map(profile => [id, profile] as const),
        catchError(() => of(null))
      )
    );
    forkJoin(lookups)
      .pipe(takeUntil(this.destroy$))
      .subscribe(entries => {
        for (const entry of entries) {
          if (entry) this.volunteerProfiles.set(entry[0], entry[1]);
        }
      });
  }

  volunteerName(app: ApplicationResponse): string {
    const profile = this.volunteerProfiles.get(app.volunteeringId);
    if (!profile) return `Candidat #${app.volunteeringId}`;
    const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
    return fullName || `@${profile.username}`;
  }

  volunteerUsername(app: ApplicationResponse): string | null {
    return this.volunteerProfiles.get(app.volunteeringId)?.username ?? null;
  }

  volunteerImage(app: ApplicationResponse): string | null {
    return this.volunteerProfiles.get(app.volunteeringId)?.profileImage ?? null;
  }

  patchStatus(app: ApplicationResponse, status: ApplicationStatus): void {
    this.updatingId = Number(app.id);
    this.candidatureService.patchStatus(Number(app.id), status)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          const idx = this.applications.findIndex(a => a.id === app.id);
          if (idx !== -1) this.applications[idx] = updated;
          this.updatingId = null;
        },
        error: (err) => { this.errorMessage = err.message; this.updatingId = null; }
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

  onBack(): void {
    this.router.navigate(['/volunteering/opportunities/my']);
  }
}
