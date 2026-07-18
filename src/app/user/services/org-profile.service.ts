import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { OrgProfileDto, UpdateOrgProfileRequest } from '../../models/org-profile.model';

@Injectable({ providedIn: 'root' })
export class OrgProfileService {

  private readonly apiUrl = `${environment.apiSecurityUrl}/api/v1/organizations`;

  constructor(private http: HttpClient) {}

  getOrgById(id: number | string): Observable<OrgProfileDto> {
    return this.http.get<OrgProfileDto>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  updateMyProfile(data: UpdateOrgProfileRequest): Observable<OrgProfileDto> {
    return this.http.put<OrgProfileDto>(`${this.apiUrl}/me`, data)
      .pipe(catchError(this.handleError));
  }

  private handleError(err: HttpErrorResponse): Observable<never> {
    let msg = 'Erreur serveur';
    if (err.error instanceof ErrorEvent) {
      msg = err.error.message;
    } else {
      switch (err.status) {
        case 401: msg = 'Non autorisé. Veuillez vous reconnecter.'; break;
        case 403: msg = 'Accès refusé.'; break;
        case 404: msg = 'Organisation introuvable.'; break;
        default: msg = err?.error?.message ?? `Erreur ${err.status}`;
      }
    }
    return throwError(() => new Error(msg));
  }
}
