import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { OpportunityService } from '../services/opportunity.service';
import { AuthService } from '../../auth/services/auth.service';
import { Opportunity } from '../../models/opportunity.model';

@Component({
  selector: 'app-opportunity-my',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './opportunity-my.component.html',
  styleUrl: './opportunity-my.component.css'
})
export class OpportunityMyComponent implements OnInit, OnDestroy {

  opportunities: Opportunity[] = [];
  isLoading = false;
  errorMessage = '';
  deleteConfirmId: string | null = null;
  isDeleting = false;

  currentPage = 0;
  pageSize = 10;
  totalItems = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private opportunityService: OpportunityService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchOpportunities();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private get orgId(): number | null {
    const id = this.authService.getUserData()?.userId;
    return id ? Number(id) : null;
  }

  private fetchOpportunities(): void {
    const orgId = this.orgId;
    if (!orgId) {
      this.errorMessage = 'Impossible de récupérer votre identifiant organisation.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.opportunityService.getOpportunitiesByOrgId(orgId, this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.opportunities = data.opportunities || [];
          this.totalItems = data.totalItems || 0;
          this.isLoading = false;
        },
        error: (err) => {
          this.errorMessage = err.message || 'Erreur lors du chargement.';
          this.isLoading = false;
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.fetchOpportunities();
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize) || 0;
  }

  get pageStart(): number {
    return this.currentPage * this.pageSize + 1;
  }

  get pageEnd(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalItems);
  }

  onEdit(id: string): void {
    this.router.navigate(['/volunteering/opportunities', id, 'edit']);
  }

  onView(id: string): void {
    this.router.navigate(['/volunteering/opportunities', id]);
  }

  onApplications(id: string): void {
    this.router.navigate(['/volunteering/opportunities', id, 'applications']);
  }

  confirmDelete(id: string): void {
    this.deleteConfirmId = id;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  onDelete(id: string): void {
    this.isDeleting = true;
    this.opportunityService.deleteOpportunity(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleteConfirmId = null;
          this.isDeleting = false;
          this.fetchOpportunities();
        },
        error: (err) => {
          this.errorMessage = err.message || 'Erreur lors de la suppression.';
          this.deleteConfirmId = null;
          this.isDeleting = false;
        }
      });
  }
}
