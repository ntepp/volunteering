import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { CandidatureService } from '../../opportunity/services/candidature.service';
import { AuthService } from '../../auth/services/auth.service';
import { ApplicationResponse } from '../../models/application.model';

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './application-list.component.html',
  styleUrl: './application-list.component.css'
})
export class ApplicationListComponent implements OnInit, OnDestroy {
  applications: ApplicationResponse[] = [];
  isLoading = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private candidatureService: CandidatureService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadApplications(): void {
    const userData = this.authService.getUserData();
    let user: any = null;
    try {
      user = userData?.user ? JSON.parse(userData.user) : null;
    } catch {
      user = null;
    }

    if (!user?.id) {
      this.errorMessage = 'Vous devez être connecté pour voir vos candidatures.';
      return;
    }

    this.isLoading = true;
    this.candidatureService.getVolunteerApplications(user.id.toString())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (apps) => {
          this.applications = apps;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.message || 'Erreur lors du chargement des candidatures.';
          this.isLoading = false;
        }
      });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING':  return 'En attente';
      case 'ACCEPTED': return 'Acceptée';
      case 'REJECTED': return 'Refusée';
      default:         return status;
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING':  return 'schedule';
      case 'ACCEPTED': return 'check_circle';
      case 'REJECTED': return 'cancel';
      default:         return 'help_outline';
    }
  }

  viewDetail(application: ApplicationResponse): void {
    this.router.navigate(['/applications', application.id], { state: { application } });
  }

  goToOpportunities(): void {
    this.router.navigate(['/volunteering/opportunities']);
  }
}
