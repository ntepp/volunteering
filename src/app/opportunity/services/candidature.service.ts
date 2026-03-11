import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApplicationRequest, ApplicationResponse } from '../../models/application.model';

@Injectable({
  providedIn: 'root'
})
export class CandidatureService {
  private readonly apiUrl = environment.apiUrl + '/api/applications';

  constructor(private http: HttpClient) {}

  /**
   * Postuler à une opportunité
   */
  applyToOpportunity(opportunityId: string, volunteeringId: string): Observable<ApplicationResponse> {
    const token = this.getAuthToken();
    
    if (!token) {
      return throwError(() => new Error('Token d\'authentification manquant'));
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    const applicationData: ApplicationRequest = {
      volunteeringId,
      opportunityId,
      status: 'PENDING'
    };

    return this.http.post<ApplicationResponse>(this.apiUrl, applicationData, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer les candidatures d'un volontaire
   */
  getVolunteerApplications(volunteeringId: string): Observable<ApplicationResponse[]> {
    const token = this.getAuthToken();
    
    if (!token) {
      return throwError(() => new Error('Token d\'authentification manquant'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<ApplicationResponse[]>(`${this.apiUrl}/${volunteeringId}`, { headers })
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Récupérer le token d'authentification depuis localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  }

  /**
   * Gestion centralisée des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors de la candidature';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = error.error.message;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || 'Données de candidature invalides';
          break;
        case 401:
          errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
          break;
        case 403:
          errorMessage = 'Accès refusé pour cette candidature';
          break;
        case 404:
          errorMessage = 'Opportunité non trouvée';
          break;
        case 409:
          errorMessage = 'Vous avez déjà postulé à cette opportunité';
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
