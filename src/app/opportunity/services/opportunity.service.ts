import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { OpportunityPagination } from '../../models/opportunity-pagination.model';
import { Opportunity, CreateOpportunityRequest } from '../../models/opportunity.model';
import { Router } from '@angular/router';
import { Category } from '../../models/category.model';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class OpportunityService {

  private apiUrl = environment.apiUrl + "/api/v1/opportunities";

  constructor(
    private http: HttpClient, 
    private router: Router,
    private authService: AuthService
  ) { }

  /**
   * Récupère la liste paginée des opportunités (sans filtres)
   */
  getOpportunity(currentPage: number, itemsPerPage: number): Observable<OpportunityPagination> {
    const params = new HttpParams()
      .set("page", currentPage)
      .set("size", itemsPerPage);
    
    return this.http.get<OpportunityPagination>(this.apiUrl, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupère la liste paginée des opportunités avec filtres optionnels
   */
  getOpportunitiesWithFilters(options: {
    page: number;
    size: number;
    categoryId?: string | null;
    town?: string | null;
    startDate?: string | null; // YYYY-MM-DD
    title?: string | null;
  }): Observable<OpportunityPagination> {
    let params = new HttpParams()
      .set('page', String(options.page))
      .set('size', String(options.size));

    if (options.categoryId) {
      params = params.set('categoryId', options.categoryId);
    }
    if (options.town) {
      params = params.set('town', options.town);
    }
    if (options.startDate) {
      params = params.set('startDate', options.startDate);
    }
    if (options.title) {
      params = params.set('title', options.title);
    }

    return this.http.get<OpportunityPagination>(this.apiUrl, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crée une nouvelle opportunité
   */
  createOpportunity(opportunity: CreateOpportunityRequest): Observable<any> {
    // TODO: Réactiver l'authentification plus tard
    // const token = this.authService.getToken();
    // 
    // if (!token) {
    //   return throwError(() => new Error('Token d\'authentification manquant'));
    // }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
      // 'Authorization': `Bearer ${token}` // Désactivé temporairement
    });

    return this.http.post(this.apiUrl, opportunity, { headers, observe: 'response' })
      .pipe(
        map((response: HttpResponse<any>) => {
          // Redirection vers la liste des opportunités en cas de succès
          this.router.navigate(['/opportunities'], { 
            queryParams: { message: 'Opportunité créée avec succès!' }
          });
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Récupère la liste des catégories
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${environment.apiUrl}/api/v1/categories`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Gestion centralisée des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = error.error.message;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Données invalides';
          break;
        case 401:
          errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
          break;
        case 403:
          errorMessage = 'Accès refusé';
          break;
        case 404:
          errorMessage = 'Service non trouvé';
          break;
        case 409:
          errorMessage = 'Conflit de données';
          break;
        case 422:
          errorMessage = 'Données de validation invalides';
          break;
        case 500:
          errorMessage = 'Erreur serveur interne';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.statusText}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
