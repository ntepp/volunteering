import { Inject, Injectable, NgZone, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Subscription, of, timer } from 'rxjs';
import { catchError, take } from 'rxjs/operators';

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
    private authService: AuthService,
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
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

  /**
   * Démarre le polling 60 s (idempotent), navigateur uniquement.
   * Le timer récurrent tourne HORS de la zone Angular : sinon il maintient
   * l'app perpétuellement « instable » et bloque la fin de l'hydratation SSR
   * (NG0506), ce qui laisse à l'écran le DOM serveur (déconnecté). Chaque tick
   * ré-entre dans la zone le temps de rafraîchir l'état.
   */
  startPolling(): void {
    if (this.pollSub || !isPlatformBrowser(this.platformId)) {
      return;
    }
    this.refresh();
    this.pollSub = this.ngZone.runOutsideAngular(() =>
      timer(POLL_INTERVAL_MS, POLL_INTERVAL_MS)
        .subscribe(() => this.ngZone.run(() => this.refresh()))
    );
  }

  stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = undefined;
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
