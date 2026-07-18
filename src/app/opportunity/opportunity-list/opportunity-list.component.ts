import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, of, takeUntil, tap } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { OpportunityService } from '../services/opportunity.service';
import { OpportunityPagination } from '../../models/opportunity-pagination.model';
import { Category } from '../../models/category.model';
import { OpportunityResponseDto } from '../../models/opportunity.model';
import { AuthService } from '../../auth/services/auth.service';
import { VolunteerProfileService } from '../../user/services/volunteer-profile.service';
import { OpportunityCardComponent } from '../../shared/opportunity-card/opportunity-card.component';

@Component({
  selector: 'app-opportunity-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    OpportunityCardComponent
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
  filtersOpen = false;

  feedPreferred: OpportunityResponseDto[] = [];
  feedRecent: OpportunityResponseDto[] = [];
  isFeedLoading = false;
  isVolunteer = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private opportunityService: OpportunityService,
    private router: Router,
    private authService: AuthService,
    private volunteerProfileService: VolunteerProfileService
  ) {}

  ngOnInit(): void {
    this.initFiltersForm();
    this.loadCategories();
    this.setupAutoRefresh();
    this.fetchOpportunities();
    this.loadFeed();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  readonly workTypes = [
    { value: 'REMOTE', label: 'À distance' },
    { value: 'ON_SITE', label: 'Sur place' },
    { value: 'HYBRID', label: 'Hybride' }
  ];

  readonly statuses = [
    { value: 'OPEN', label: 'Ouverte' },
    { value: 'CLOSED', label: 'Fermée' },
    { value: 'DRAFT', label: 'Brouillon' }
  ];

  private initFiltersForm(): void {
    this.filtersForm = this.fb.group({
      category: [null],
      town: [''],
      startDate: [null],
      title: [''],
      workType: [null],
      status: [null]
    });
  }

  private loadCategories(): void {
    this.opportunityService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        // Dédoublonne par nom : l'API peut contenir plusieurs documents de même nom
        next: (cats) => this.categories = cats.filter(
          (cat, i, all) => all.findIndex(c => c.name === cat.name) === i
        ),
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

  onPageChange(pageIndex: number): void {
    this.opportunityPagination.currentPage = pageIndex;
    this.fetchOpportunities();
  }

  onPageSizeChange(size: number): void {
    this.opportunityPagination.itemsPerPage = size;
    this.opportunityPagination.currentPage = 0;
    this.fetchOpportunities();
  }

  get totalPages(): number {
    return Math.ceil(this.opportunityPagination.totalItems / this.opportunityPagination.itemsPerPage) || 0;
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  get pageStart(): number {
    return this.opportunityPagination.currentPage * this.opportunityPagination.itemsPerPage + 1;
  }

  get pageEnd(): number {
    return Math.min(
      (this.opportunityPagination.currentPage + 1) * this.opportunityPagination.itemsPerPage,
      this.opportunityPagination.totalItems
    );
  }

  onApplyFilters(): void {
    this.resetToFirstPage();
    this.fetchOpportunities();
  }

  onResetFilters(): void {
    this.filtersForm.reset({
      category: null,
      town: '',
      startDate: null,
      title: '',
      workType: null,
      status: null
    });
  }

  get activeCategory(): string | null {
    return this.filtersForm.get('category')?.value ?? null;
  }

  /**
   * Applique les filtres courants à une opportunité, avec la même sémantique
   * que la recherche serveur (titre/ville en contient, catégorie/type/statut
   * exacts, date de début minimale). Utilisé pour les sections du feed
   * ("Pour vous", "Opportunités récentes") qui sont chargées non filtrées.
   */
  private matchesFilters(opp: OpportunityResponseDto): boolean {
    const f = this.filtersForm.value;

    const title = (f.title ?? '').trim().toLowerCase();
    if (title && !(opp.title ?? '').toLowerCase().includes(title)) return false;

    const town = (f.town ?? '').trim().toLowerCase();
    if (town && !(opp.town ?? '').toLowerCase().includes(town)) return false;

    if (f.category) {
      const cats = opp.categoryNames?.length
        ? opp.categoryNames
        : (opp.categories ?? []).map(c => c.name);
      if (!cats.includes(f.category)) return false;
    }

    if (f.workType && opp.workType !== f.workType) return false;
    if (f.status && opp.status !== f.status) return false;

    if (f.startDate) {
      const min = new Date(f.startDate).getTime();
      if (!opp.startDate || new Date(opp.startDate).getTime() < min) return false;
    }

    return true;
  }

  /** Nombre maximal de cartes par section du feed. */
  private static readonly FEED_SECTION_LIMIT = 6;

  get filteredFeedPreferred(): OpportunityResponseDto[] {
    return this.feedPreferred
      .filter(o => this.matchesFilters(o))
      .slice(0, OpportunityListComponent.FEED_SECTION_LIMIT);
  }

  /** « Récentes » sans les offres déjà affichées dans « Pour vous ». */
  get filteredFeedRecent(): OpportunityResponseDto[] {
    const shownInPreferred = new Set(this.filteredFeedPreferred.map(o => o.id));
    return this.feedRecent
      .filter(o => this.matchesFilters(o) && !shownInPreferred.has(o.id))
      .slice(0, OpportunityListComponent.FEED_SECTION_LIMIT);
  }

  onCategoryChip(name: string | null): void {
    const current = this.activeCategory;
    this.filtersForm.get('category')!.setValue(current === name ? null : name);
  }

  private fetchOpportunities(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const formValue = this.filtersForm.value;
    const startDateStr = formValue.startDate ? this.formatDate(formValue.startDate) : null;

    this.opportunityService.getOpportunitiesWithFilters({
      page: this.opportunityPagination.currentPage,
      size: this.opportunityPagination.itemsPerPage,
      category: formValue.category,
      town: formValue.town?.trim() || null,
      startDate: startDateStr,
      title: formValue.title?.trim() || null,
      workType: formValue.workType || null,
      status: formValue.status || null
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

  private loadFeed(): void {
    this.isFeedLoading = true;
    const isAuth = this.authService.isAuthenticated();
    const role = this.authService.getUserRole();

    if (isAuth && role === 'VOLUNTEER') {
      this.isVolunteer = true;
      this.volunteerProfileService.getMyProfile()
        .pipe(
          takeUntil(this.destroy$),
          catchError(() => of({ preferredCategories: [] as string[] })),
          switchMap((profile) => {
            const cats = profile?.preferredCategories ?? [];
            return this.opportunityService.getFeed(cats).pipe(
              catchError(() => of({ preferred: [], recent: [] }))
            );
          })
        )
        .subscribe({
          next: (feed) => {
            this.feedPreferred = feed.preferred ?? [];
            this.feedRecent = feed.recent ?? [];
            this.isFeedLoading = false;
          },
          error: () => {
            this.feedPreferred = [];
            this.feedRecent = [];
            this.isFeedLoading = false;
          }
        });
    } else {
      this.isVolunteer = false;
      this.opportunityService.getFeed([])
        .pipe(
          takeUntil(this.destroy$),
          catchError(() => of({ preferred: [], recent: [] }))
        )
        .subscribe({
          next: (feed) => {
            this.feedPreferred = [];
            this.feedRecent = feed.recent ?? [];
            this.isFeedLoading = false;
          },
          error: () => {
            this.feedPreferred = [];
            this.feedRecent = [];
            this.isFeedLoading = false;
          }
        });
    }
  }

  private formatDate(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  navigateToDetail(opportunityId: string): void {
    this.router.navigate(['/volunteering/opportunities', opportunityId]);
  }
}
