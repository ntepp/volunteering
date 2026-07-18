import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';

import { VolunteerProfileService, VolunteerProfile } from '../services/volunteer-profile.service';
import { CandidatureService, PublicParticipation } from '../../opportunity/services/candidature.service';
import { OpportunityService } from '../../opportunity/services/opportunity.service';

export interface ParticipationItem {
  opportunityId: string;
  title: string;
  date: string;
}

@Component({
  selector: 'app-volunteer-public-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './volunteer-public-profile.component.html',
  styleUrl: './volunteer-public-profile.component.css'
})
export class VolunteerPublicProfileComponent implements OnInit, OnDestroy {
  profile: VolunteerProfile | null = null;
  isLoading = true;
  errorMessage = '';
  username = '';

  participations: ParticipationItem[] = [];
  isLoadingParticipations = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private profileService: VolunteerProfileService,
    private candidatureService: CandidatureService,
    private opportunityService: OpportunityService
  ) {}

  ngOnInit(): void {
    this.username = this.route.snapshot.paramMap.get('username') ?? '';
    this.profileService.getPublicProfile(this.username)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile) => {
          this.profile = profile;
          this.isLoading = false;
          this.loadParticipations(profile.id);
        },
        error: (err) => {
          this.errorMessage = err.message ?? 'Profil introuvable.';
          this.isLoading = false;
        }
      });
  }

  /** Historique public : candidatures acceptées, avec résolution des titres d'offres. */
  private loadParticipations(volunteerId: number): void {
    this.isLoadingParticipations = true;
    this.candidatureService.getParticipations(volunteerId)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of([] as PublicParticipation[])),
        switchMap((participations) => {
          if (!participations.length) return of([] as ParticipationItem[]);
          const lookups = participations.map(p =>
            this.opportunityService.getOpportunityById(p.opportunityId).pipe(
              map((opp: any) => ({
                opportunityId: p.opportunityId,
                title: opp?.title || 'Opportunité',
                date: p.updatedAt || p.appliedAt
              })),
              catchError(() => of({
                opportunityId: p.opportunityId,
                title: 'Opportunité',
                date: p.updatedAt || p.appliedAt
              }))
            )
          );
          return forkJoin(lookups);
        })
      )
      .subscribe({
        next: (items) => {
          this.participations = items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          this.isLoadingParticipations = false;
        },
        error: () => { this.isLoadingParticipations = false; }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
