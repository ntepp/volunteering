import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, tap } from 'rxjs';

import { OpportunityService } from '../services/opportunity.service';
import { OpportunityPagination } from '../../models/opportunity-pagination.model';
import { Category } from '../../models/category.model';

@Component({
  selector: 'app-opportunity-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatPaginatorModule
  ],
  templateUrl: './opportunity-list.component.html',
  styleUrl: './opportunity-list.component.css'
})
export class OpportunityListComponent implements OnInit, OnDestroy {

  filtersForm!: FormGroup;
  categories: Category[] = [];

  opportunityPagination: OpportunityPagination = {
    currentPage: 0,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 0,
    opportunities: []
  };

  isLoading = false;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private opportunityService: OpportunityService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initFiltersForm();
    this.loadCategories();
    this.setupAutoRefresh();

    // Chargement initial
    this.fetchOpportunities();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initFiltersForm(): void {
    this.filtersForm = this.fb.group({
      categoryId: [null],
      town: [''],
      startDate: [null],
      title: ['']
    });
  }

  private loadCategories(): void {
    this.opportunityService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cats) => this.categories = cats,
        error: () => {}
      });
  }

  private setupAutoRefresh(): void {
    this.filtersForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.resetToFirstPage()),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.fetchOpportunities());
  }

  private resetToFirstPage(): void {
    this.opportunityPagination.currentPage = 0;
  }

  onPageChange(event: PageEvent) {
    this.opportunityPagination.currentPage = event.pageIndex;
    this.opportunityPagination.itemsPerPage = event.pageSize;
    this.fetchOpportunities();
  }

  // Déclenche une recherche explicite avec les filtres actuels
  onApplyFilters(): void {
    this.resetToFirstPage();
    this.fetchOpportunities();
  }

  private fetchOpportunities(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const formValue = this.filtersForm.value;
    const startDateStr = formValue.startDate ? this.formatDate(formValue.startDate) : null;

    this.opportunityService.getOpportunitiesWithFilters({
      page: this.opportunityPagination.currentPage,
      size: this.opportunityPagination.itemsPerPage,
      categoryId: formValue.categoryId,
      town: formValue.town?.trim() || null,
      startDate: startDateStr,
      title: formValue.title?.trim() || null
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (data) => {
        this.opportunityPagination.opportunities = data.opportunities || [];
        this.opportunityPagination.totalItems = data.totalItems || 0;
        this.opportunityPagination.totalPages = data.totalPages || 0;
      },
      error: (err) => {
        this.errorMessage = err.message || 'Erreur lors du chargement des opportunités';
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  private formatDate(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  /**
   * Navigue vers la page de détail d'une opportunité
   */
  navigateToDetail(opportunityId: string): void {
    this.router.navigate(['/volunteering/opportunities', opportunityId]);
  }
}
