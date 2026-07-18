import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SendCodeRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface VerifyCodeResponse {
  user?: any;
  role?: string;
  message?: string;
  success?: boolean;
}

export interface ApiError {
  message: string;
}

export interface UserSessionData {
  user: string | null;
  role: string | null;
  userId: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = environment.apiSecurityUrl || 'http://localhost:8080';

  private readonly _isAuthenticated$ = new BehaviorSubject<boolean>(this.isAuthenticated());
  readonly isAuthenticated$ = this._isAuthenticated$.asObservable();

  constructor(private http: HttpClient) {}

  sendCode(request: SendCodeRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/api/auth/send-code`, request)
      .pipe(catchError(this.handleError));
  }

  resetPassword(request: { email: string; code: string; newPassword: string }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/api/auth/reset-password`, request)
      .pipe(catchError(this.handleError));
  }

  verifyCode(request: VerifyCodeRequest): Observable<VerifyCodeResponse> {
    return this.http.post<VerifyCodeResponse>(`${this.apiUrl}/api/auth/verify-code`, request)
      .pipe(catchError(this.handleError));
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/auth/login`, credentials)
      .pipe(catchError(this.handleError));
  }

  signup(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/api/auth/signup`, userData)
      .pipe(catchError(this.handleError));
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/api/auth/logout`, {})
      .pipe(
        tap(() => this.clearUserData()),
        catchError(() => {
          this.clearUserData();
          return throwError(() => new Error('Erreur lors de la déconnexion'));
        })
      );
  }

  getMyProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/api/v1/volunteers/me`)
      .pipe(catchError(this.handleError));
  }

  updateMyProfile(data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/api/v1/volunteers/me`, data)
      .pipe(catchError(this.handleError));
  }

  saveUserData(response: any): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('role', response.role);
      if (response.userId != null) {
        localStorage.setItem('userId', String(response.userId));
      }
      this._isAuthenticated$.next(true);
    }
  }

  getUserData(): UserSessionData | null {
    if (typeof window !== 'undefined') {
      return {
        user: localStorage.getItem('user'),
        role: localStorage.getItem('role'),
        userId: localStorage.getItem('userId')
      };
    }
    return null;
  }

  getUserRole(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('role');
    }
    return null;
  }

  clearUserData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      this._isAuthenticated$.next(false);
    }
  }

  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('user');
    }
    return false;
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      if (error.status === 0) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez que le service est démarré.';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Données invalides';
      } else if (error.status === 401) {
        errorMessage = 'Email ou mot de passe invalide';
      } else if (error.status === 404) {
        errorMessage = 'Service non trouvé';
      } else if (error.status === 409) {
        errorMessage = error.error?.message || 'Cet email est déjà utilisé.';
      } else if (error.status >= 500) {
        errorMessage = 'Erreur serveur';
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
