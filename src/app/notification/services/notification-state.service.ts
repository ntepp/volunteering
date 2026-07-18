import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';

import { CandidatureService } from '../../opportunity/services/candidature.service';
import { AuthService } from '../../auth/services/auth.service';
import { ApplicationResponse } from '../../models/application.model';

export const NOTIFICATIONS_READ_STORAGE_KEY = 'notificationsReadIds';

/**
 * État partagé des notifications : expose le nombre de non-lues pour le badge
 * du header, recalculé depuis les candidatures du volontaire et l'état « lu »
 * conservé en localStorage (même clé que la page notifications).
 */
@Injectable({ providedIn: 'root' })
export class NotificationStateService {

  private readonly _unreadCount$ = new BehaviorSubject<number>(0);
  readonly unreadCount$ = this._unreadCount$.asObservable();

  constructor(
    private candidatureService: CandidatureService,
    private authService: AuthService
  ) {}

  /** Recharge le compteur depuis l'API (volontaires uniquement). */
  refresh(): void {
    if (!this.authService.isAuthenticated() || this.authService.getUserRole() !== 'VOLUNTEER') {
      this._unreadCount$.next(0);
      return;
    }
    this.candidatureService.getVolunteerApplications()
      .pipe(take(1), catchError(() => of([] as ApplicationResponse[])))
      .subscribe(apps => {
        const readIds = this.loadReadIds();
        const allIds = apps.flatMap(a => this.notificationIds(a));
        this._unreadCount$.next(allIds.filter(id => !readIds.has(id)).length);
      });
  }

  /** Mise à jour directe (la page notifications connaît déjà le compte exact). */
  setUnreadCount(count: number): void {
    this._unreadCount$.next(count);
  }

  /** Identifiants de notifications dérivés d'une candidature (même schéma que la page). */
  notificationIds(app: ApplicationResponse): string[] {
    const ids = [`${app.id}-applied`];
    if (app.status !== 'PENDING') {
      ids.push(`${app.id}-${app.status}`);
    }
    return ids;
  }

  loadReadIds(): Set<string> {
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_READ_STORAGE_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }
}
