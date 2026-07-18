import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApplicationRequest, ApplicationResponse } from '../../models/application.model';

export interface PublicParticipation {
  opportunityId: string;
  appliedAt: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CandidatureService {
  private readonly apiUrl = environment.apiApplicationUrl + '/api/applications';

  constructor(private http: HttpClient) {}

  /**
   * Postuler à une opportunité.
   * The auth_token cookie is sent automatically by the browser (withCredentials interceptor).
   */
  applyToOpportunity(opportunityId: string, volunteeringId: string, motivationText?: string): Observable<ApplicationResponse> {
    const applicationData: ApplicationRequest = {
      volunteeringId,
      opportunityId,
      motivationText,
      status: 'PENDING'
    };

    return this.http.post<ApplicationResponse>(this.apiUrl, applicationData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupérer les candidatures du volontaire authentifié.
   * Uses the /my endpoint which derives the user from the JWT cookie.
   */
  getVolunteerApplications(): Observable<ApplicationResponse[]> {
    return this.http.get<ApplicationResponse[]>(`${this.apiUrl}/my`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Historique public des participations d'un volontaire (candidatures acceptées).
   */
  getParticipations(volunteerId: string | number): Observable<PublicParticipation[]> {
    return this.http.get<PublicParticipation[]>(`${this.apiUrl}/volunteer/${volunteerId}/participations`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupérer les candidatures pour une opportunité donnée.
   */
  getOpportunityApplications(opportunityId: string): Observable<ApplicationResponse[]> {
    return this.http.get<ApplicationResponse[]>(`${this.apiUrl}/opportunity/${opportunityId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Mettre à jour le statut d'une candidature (ACCEPTED / REJECTED / VIEW).
   */
  patchStatus(applicationId: number, status: string): Observable<ApplicationResponse> {
    return this.http.patch<ApplicationResponse>(`${this.apiUrl}/${applicationId}/status`, { status })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors de la candidature';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
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
