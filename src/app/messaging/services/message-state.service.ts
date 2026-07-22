import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subscription, of, timer } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';

import { MessageService } from './message.service';
import { AuthService } from '../../auth/services/auth.service';
import { ThreadSummary } from '../../models/message.model';

const POLL_INTERVAL_MS = 60_000;

/**
 * État partagé de la messagerie : résumés des fils et total de non-lus
 * pour le badge enveloppe du header et les pastilles par candidature.
 */
@Injectable({ providedIn: 'root' })
export class MessageStateService implements OnDestroy {

  private readonly _summaries$ = new BehaviorSubject<ThreadSummary[]>([]);
  readonly summaries$ = this._summaries$.asObservable();

  private readonly _unreadTotal$ = new BehaviorSubject<number>(0);
  readonly unreadTotal$ = this._unreadTotal$.asObservable();

  private pollSub?: Subscription;

  constructor(
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  /** Recharge une fois les résumés (appelé à la navigation et après envoi). */
  refresh(): void {
    if (!this.authService.isAuthenticated()) {
      this._summaries$.next([]);
      this._unreadTotal$.next(0);
      return;
    }
    this.messageService.getSummary()
      .pipe(take(1), catchError(() => of([] as ThreadSummary[])))
      .subscribe(summaries => {
        this._summaries$.next(summaries);
        this._unreadTotal$.next(summaries.reduce((sum, s) => sum + s.unreadCount, 0));
      });
  }

  /** Démarre le polling 60 s (idempotent). */
  startPolling(): void {
    if (this.pollSub) {
      return;
    }
    this.pollSub = timer(0, POLL_INTERVAL_MS)
      .pipe(switchMap(() => {
        this.refresh();
        return of(null);
      }))
      .subscribe();
  }

  stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
