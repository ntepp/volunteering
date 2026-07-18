import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ImageUploadResponse {
  id: string;
  url: string;
}

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Injectable({ providedIn: 'root' })
export class ImageUploadService {

  private readonly apiUrl = `${environment.apiUrl}/api/v1/images`;

  constructor(private http: HttpClient) {}

  /**
   * Valide un fichier côté client avant l'upload.
   * Retourne un message d'erreur, ou null si le fichier est valide.
   */
  validate(file: File): string | null {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return 'Format non supporté. Utilisez une image JPEG, PNG, WebP ou GIF.';
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return 'L\'image dépasse la taille maximale de 5 Mo.';
    }
    return null;
  }

  upload(file: File): Observable<ImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImageUploadResponse>(this.apiUrl, formData)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let msg = 'Erreur lors de l\'envoi de l\'image';
    if (error.status === 400) {
      msg = 'Image invalide (format ou taille non supportés).';
    } else if (error.status === 401 || error.status === 403) {
      msg = 'Vous devez être connecté pour envoyer une image.';
    } else if (error.status === 413) {
      msg = 'L\'image dépasse la taille maximale de 5 Mo.';
    }
    return throwError(() => new Error(msg));
  }
}
