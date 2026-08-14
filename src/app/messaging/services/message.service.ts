import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Message, ThreadSummary } from '../../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private readonly apiUrl = environment.apiApplicationUrl + '/api/applications';

  constructor(private http: HttpClient) {}

  /** Fil chronologique d'une candidature (marque les messages reçus comme lus côté serveur). */
  getThread(candidatureId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/${candidatureId}/messages`)
      .pipe(catchError(this.handleError));
  }

  /** Envoie un message sur le fil. */
  sendMessage(candidatureId: number, content: string): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/${candidatureId}/messages`, { content })
      .pipe(catchError(this.handleError));
  }

  /** Résumé des fils de l'utilisateur courant (badge header + pastilles). */
  getSummary(): Observable<ThreadSummary[]> {
    return this.http.get<ThreadSummary[]>(`${this.apiUrl}/messages/summary`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue lors de l\'envoi du message';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      const serverMessage = error.error?.message;
      switch (error.status) {
        case 400:
          errorMessage = serverMessage || 'Le message doit contenir entre 1 et 2000 caractères';
          break;
        case 401:
          errorMessage = 'Non autorisé. Veuillez vous reconnecter.';
          break;
        case 403:
          errorMessage = 'Vous n\'avez pas accès à cette conversation';
          break;
        case 404:
          errorMessage = 'Candidature non trouvée';
          break;
        case 409:
          errorMessage = serverMessage || 'Cette conversation n\'accepte plus de messages';
          break;
        case 0:
          errorMessage = 'Service de messagerie injoignable. Réessayez plus tard.';
          break;
        default:
          errorMessage = `Erreur ${error.status} lors de l'accès à la messagerie`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
