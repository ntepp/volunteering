import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';

import { OpportunityService } from '../services/opportunity.service';
import { CandidatureService } from '../services/candidature.service';
import { AuthService } from '../../auth/services/auth.service';
import { Opportunity } from '../../models/opportunity.model';
import { Application } from '../../models/application.model';

@Component({
  selector: 'app-opportunity-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './opportunity-detail.component.html',
  styleUrls: ['./opportunity-detail.component.css']
})
export class OpportunityDetailComponent implements OnInit, OnDestroy {
  
  opportunity: Opportunity | null = null;
  isLoading = false;
  isApplying = false;
  hasApplied = false;
  applicationStatus: 'PENDING' | 'ACCEPTED' | 'REJECTED' | null = null;
  errorMessage = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private opportunityService: OpportunityService,
    private candidatureService: CandidatureService,
    private authService: AuthService,
    private snackBar: MatSnackBar
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

    // Pour l'instant, on récupère l'ID depuis les paramètres de route
    // Dans un vrai projet, on aurait un service pour récupérer une opportunité par ID
    const opportunityId = this.route.snapshot.paramMap.get('id');
    
    if (!opportunityId) {
      this.errorMessage = 'ID d\'opportunité manquant';
      this.isLoading = false;
      return;
    }

    // Simulation de chargement d'opportunité
    // Dans un vrai projet, on appellerait opportunityService.getOpportunityById(opportunityId)
    this.simulateOpportunityLoad(opportunityId);
  }

  private simulateOpportunityLoad(opportunityId: string): void {
    // Simulation d'une opportunité pour les tests
    setTimeout(() => {
      this.opportunity = {
        id: opportunityId,
        title: 'Aide aux personnes âgées',
        description: 'Nous recherchons des bénévoles pour accompagner les personnes âgées dans leurs activités quotidiennes et leur apporter du réconfort.',
        location: 'Centre communautaire de Paris',
        town: 'Paris',
        startDate: '2024-02-01',
        endDate: '2024-12-31',
        requirements: 'Patience, empathie et disponibilité le weekend',
        orgId: 1,
        skillsRequired: [
          { name: 'Empathie', level: 'Intermédiaire' },
          { name: 'Communication', level: 'Avancé' }
        ],
        categories: [
          { id: '1', name: 'Social' }
        ]
      };
      this.isLoading = false;
      this.checkExistingApplication();
    }, 1000);
  }

  private checkExistingApplication(): void {
    const user = this.authService.getUserData();
    if (user && this.opportunity?.id) {
      // Vérifier si l'utilisateur a déjà postulé
      this.candidatureService.getVolunteerApplications(user.id.toString())
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (applications) => {
            const existingApplication = applications.find(app => 
              app.opportunityId === this.opportunity?.id
            );
            if (existingApplication) {
              this.hasApplied = true;
              this.applicationStatus = existingApplication.status;
            }
          },
          error: (error) => {
            // En cas d'erreur, on continue sans bloquer l'affichage
            console.warn('Impossible de vérifier les candidatures existantes:', error);
          }
        });
    }
  }

  apply(): void {
    if (!this.opportunity?.id || this.isApplying || this.hasApplied) {
      return;
    }

    const user = this.authService.getUserData();
    if (!user) {
      this.showErrorMessage('Vous devez être connecté pour postuler');
      return;
    }

    this.isApplying = true;
    this.errorMessage = '';

    this.candidatureService.applyToOpportunity(this.opportunity.id, user.id.toString())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isApplying = false;
          this.hasApplied = true;
          this.applicationStatus = 'PENDING';
          this.showSuccessMessage();
        },
        error: (error) => {
          this.isApplying = false;
          this.errorMessage = error.message;
          this.showErrorMessage(error.message);
        }
      });
  }

  private showSuccessMessage(): void {
    this.snackBar.open('Votre candidature a été soumise avec succès ✅', 'Fermer', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  getApplicationStatusText(): string {
    switch (this.applicationStatus) {
      case 'PENDING':
        return 'En attente';
      case 'ACCEPTED':
        return 'Acceptée';
      case 'REJECTED':
        return 'Refusée';
      default:
        return '';
    }
  }

  getApplicationStatusColor(): string {
    switch (this.applicationStatus) {
      case 'PENDING':
        return 'accent';
      case 'ACCEPTED':
        return 'primary';
      case 'REJECTED':
        return 'warn';
      default:
        return 'primary';
    }
  }

  onBackToList(): void {
    this.router.navigate(['/opportunities']);
  }
}
