import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface VolunteerProfile {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  country?: string;
  city?: string;
  profileImage?: string;
  preferredCategories?: string[];
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  city?: string;
  country?: string;
  phone?: string;
  profileImage?: string;
  preferredCategories?: string[];
}

@Injectable({ providedIn: 'root' })
export class VolunteerProfileService {

  private readonly apiUrl = `${environment.apiSecurityUrl}/api/v1/volunteers`;

  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<VolunteerProfile> {
    return this.http.get<VolunteerProfile>(`${this.apiUrl}/me`)
      .pipe(catchError(this.handleError));
  }

  updateMyProfile(data: UpdateProfileRequest): Observable<VolunteerProfile> {
    return this.http.put<VolunteerProfile>(`${this.apiUrl}/me`, data)
      .pipe(catchError(this.handleError));
  }

  getPublicProfile(username: string): Observable<VolunteerProfile> {
    return this.http.get<VolunteerProfile>(`${this.apiUrl}/${username}`)
      .pipe(catchError(this.handleError));
  }

  /** Profil public par id — les candidatures ne portent que l'id du volontaire. */
  getPublicProfileById(id: string | number): Observable<VolunteerProfile> {
    return this.http.get<VolunteerProfile>(`${this.apiUrl}/by-id/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let msg = 'Une erreur est survenue';
    if (error.error instanceof ErrorEvent) {
      msg = error.error.message;
    } else {
      switch (error.status) {
        case 401: msg = 'Non autorisé. Veuillez vous reconnecter.'; break;
        case 403: msg = 'Accès refusé.'; break;
        case 404: msg = 'Profil introuvable.'; break;
        default: msg = `Erreur ${error.status}: ${error.statusText}`;
      }
    }
    return throwError(() => new Error(msg));
  }
}
