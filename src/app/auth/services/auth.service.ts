import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SendCodeRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface VerifyCodeResponse {
  token: string;
  user?: any;
  role?: string;
}

export interface ApiError {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = environment.apiSecurityUrl || 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  sendCode(request: SendCodeRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/api/auth/send-code`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  verifyCode(request: VerifyCodeRequest): Observable<VerifyCodeResponse> {
    return this.http.post<VerifyCodeResponse>(`${this.apiUrl}/api/auth/verify-code`, request)
      .pipe(
        catchError(this.handleError)
      );
  }

  saveToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  signup(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/auth/signup`, userData)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Connexion d'un utilisateur
   */
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/auth/login`, credentials)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Sauvegarde des données utilisateur après connexion
   */
  saveUserData(response : any): void {
    if (typeof window !== 'undefined') {
      // Sauvegarder le token dans auth_token pour cohérence avec isAuthenticated()
      localStorage.setItem('auth_token', response.token);
      // Sauvegarder aussi dans authToken pour compatibilité
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('role', response.role);
    }
  }

  /**
   * Récupération des données utilisateur
   */
  getUserData(): any | null {
    if (typeof window !== 'undefined') {
      const userData = {"user": localStorage.getItem('user'), "role": localStorage.getItem('role')};
      return userData ? userData: null;
    }
    return null;
  }

  /**
   * Suppression des données utilisateur
   */
  clearUserData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = error.error.message;
    } else {
      // Erreur côté serveur
      if (error.status === 400) {
        errorMessage = error.error?.message || 'Données invalides';
      } else if (error.status === 401) {
        errorMessage = 'Email ou mot de passe invalide';
      } else if (error.status === 404) {
        errorMessage = 'Service non trouvé';
      } else if (error.status >= 500) {
        errorMessage = 'Erreur serveur';
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}
