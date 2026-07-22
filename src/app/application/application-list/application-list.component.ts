import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, of, Subject, takeUntil } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { CandidatureService } from '../../opportunity/services/candidature.service';
import { OpportunityService } from '../../opportunity/services/opportunity.service';
import { AuthService } from '../../auth/services/auth.service';
import { MessageStateService } from '../../messaging/services/message-state.service';
import { ApplicationResponse, ApplicationStatus } from '../../models/application.model';

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './application-list.component.html',
  styleUrl: './application-list.component.css'
})
export class ApplicationListComponent implements OnInit, OnDestroy {

  applications: ApplicationResponse[] = [];
  opportunityTitles = new Map<string, string>();
  isLoading = false;
  errorMessage = '';
  messageSummaries = new Map<number, number>(); // candidatureId -> unreadCount

  private destroy$ = new Subject<void>();

  constructor(
    private candidatureService: CandidatureService,
    private opportunityService: OpportunityService,
    private authService: AuthService,
    private messageState: MessageStateService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadApplications();
    this.messageState.refresh();
    this.messageState.summaries$
      .pipe(takeUntil(this.destroy$))
      .subscribe(summaries => {
        this.messageSummaries = new Map(summaries.map(s => [s.candidatureId, s.unreadCount]));
      });
  }

  hasThread(candidatureId: string): boolean {
    return this.messageSummaries.has(Number(candidatureId));
  }

  unreadFor(candidatureId: string): number {
    return this.messageSummaries.get(Number(candidatureId)) ?? 0;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadApplications(): void {
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'Vous devez être connecté pour voir vos candidatures.';
      return;
    }

    this.isLoading = true;
    this.candidatureService.getVolunteerApplications()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (apps) => {
          this.applications = apps;
          this.enrichWithTitles(apps);
        },
        error: (err) => { this.errorMessage = err.message; this.isLoading = false; }
      });
  }

  private enrichWithTitles(apps: ApplicationResponse[]): void {
    const uniqueIds = [...new Set(apps.map(a => a.opportunityId))];
    if (uniqueIds.length === 0) { this.isLoading = false; return; }

    const requests = uniqueIds.map(id =>
      this.opportunityService.getOpportunityById(id).pipe(catchError(() => of(null)))
    );

    forkJoin(requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe(results => {
        uniqueIds.forEach((id, i) => {
          const opp = results[i] as any;
          if (opp?.title) this.opportunityTitles.set(id, opp.title);
        });
        this.isLoading = false;
      });
  }

  getTitle(opportunityId: string): string {
    return this.opportunityTitles.get(opportunityId) ?? `Opportunité #${opportunityId.slice(0, 8)}`;
  }

  statusLabel(status: ApplicationStatus): string {
    const labels: Record<ApplicationStatus, string> = {
      PENDING: 'En attente', VIEW: 'Consultée', ACCEPTED: 'Acceptée',
      REJECTED: 'Rejetée', CLOSED: 'Fermée'
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

  /** La carte ouvre l'offre concernée — c'est là que se trouve l'action utile. */
  viewDetail(app: ApplicationResponse): void {
    this.router.navigate(['/volunteering/opportunities', app.opportunityId]);
  }
}
