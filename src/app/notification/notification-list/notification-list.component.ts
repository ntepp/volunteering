import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';

import { CandidatureService } from '../../opportunity/services/candidature.service';
import { OpportunityService } from '../../opportunity/services/opportunity.service';
import { AuthService } from '../../auth/services/auth.service';
import { NotificationStateService } from '../services/notification-state.service';
import { ApplicationResponse, ApplicationStatus } from '../../models/application.model';

export interface NotificationItem {
  id: string;
  message: string;
  date: Date;
  read: boolean;
  icon: string;
  iconClass: string;
  opportunityId?: string;
}

const READ_STORAGE_KEY = 'notificationsReadIds';

/**
 * Notifications dérivées des candidatures du volontaire :
 * envoi de candidature + changements de statut (consultée, acceptée, rejetée, clôturée).
 */
@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.css'
})
export class NotificationListComponent implements OnInit, OnDestroy {

  notifications: NotificationItem[] = [];
  isLoading = false;
  errorMessage = '';
  isVolunteer = false;
  isAuthenticated = false;

  private destroy$ = new Subject<void>();

  constructor(
    private candidatureService: CandidatureService,
    private opportunityService: OpportunityService,
    private authService: AuthService,
    private notificationState: NotificationStateService
  ) {}

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    this.isVolunteer = this.isAuthenticated && this.authService.getUserRole() === 'VOLUNTEER';
    if (this.isVolunteer) {
      this.loadNotifications();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markAllRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.persistReadIds();
    this.notificationState.setUnreadCount(0);
  }

  markRead(n: NotificationItem): void {
    n.read = true;
    this.persistReadIds();
    this.notificationState.setUnreadCount(this.unreadCount);
  }

  private loadNotifications(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.candidatureService.getVolunteerApplications()
      .pipe(
        takeUntil(this.destroy$),
        switchMap((apps) => {
          const uniqueIds = [...new Set(apps.map(a => a.opportunityId).filter(Boolean))];
          if (!uniqueIds.length) {
            return of({ apps, titles: new Map<string, string>() });
          }
          const lookups = uniqueIds.map(id =>
            this.opportunityService.getOpportunityById(id).pipe(
              map((opp: any) => [id, opp?.title as string] as const),
              catchError(() => of([id, ''] as const))
            )
          );
          return forkJoin(lookups).pipe(
            map(entries => ({ apps, titles: new Map(entries.map(([k, v]) => [k, v])) }))
          );
        })
      )
      .subscribe({
        next: ({ apps, titles }) => {
          this.notifications = this.buildNotifications(apps, titles);
          this.isLoading = false;
          this.notificationState.setUnreadCount(this.unreadCount);
        },
        error: (err) => {
          this.errorMessage = err.message || 'Impossible de charger vos notifications.';
          this.isLoading = false;
        }
      });
  }

  private buildNotifications(apps: ApplicationResponse[], titles: Map<string, string>): NotificationItem[] {
    const readIds = this.loadReadIds();
    const items: NotificationItem[] = [];

    for (const app of apps) {
      const title = titles.get(app.opportunityId) || 'une opportunité';

      items.push({
        id: `${app.id}-applied`,
        message: `Votre candidature pour « ${title} » a bien été envoyée.`,
        date: new Date(app.appliedAt),
        read: readIds.has(`${app.id}-applied`),
        icon: 'send',
        iconClass: 'bg-sky-100 text-sky-600',
        opportunityId: app.opportunityId
      });

      if (app.status !== 'PENDING') {
        const statusEvent = this.statusEvent(app.status, title);
        items.push({
          id: `${app.id}-${app.status}`,
          message: statusEvent.message,
          date: new Date(app.updatedAt || app.appliedAt),
          read: readIds.has(`${app.id}-${app.status}`),
          icon: statusEvent.icon,
          iconClass: statusEvent.iconClass,
          opportunityId: app.opportunityId
        });
      }
    }

    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  private statusEvent(status: ApplicationStatus, title: string): { message: string; icon: string; iconClass: string } {
    switch (status) {
      case 'VIEW':
        return {
          message: `Votre candidature pour « ${title} » a été consultée par l'organisation.`,
          icon: 'visibility',
          iconClass: 'bg-sky-100 text-sky-600'
        };
      case 'ACCEPTED':
        return {
          message: `Bonne nouvelle ! Votre candidature pour « ${title} » a été acceptée.`,
          icon: 'check_circle',
          iconClass: 'bg-green-100 text-green-600'
        };
      case 'REJECTED':
        return {
          message: `Votre candidature pour « ${title} » n'a pas été retenue.`,
          icon: 'cancel',
          iconClass: 'bg-red-100 text-red-500'
        };
      case 'CLOSED':
      default:
        return {
          message: `L'opportunité « ${title} » a été clôturée.`,
          icon: 'lock',
          iconClass: 'bg-slate-100 text-slate-500'
        };
    }
  }

  private loadReadIds(): Set<string> {
    try {
      const raw = localStorage.getItem(READ_STORAGE_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }

  private persistReadIds(): void {
    try {
      const readIds = this.notifications.filter(n => n.read).map(n => n.id);
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(readIds));
    } catch {
      // Stockage indisponible (SSR / navigation privée) — l'état lu reste en mémoire.
    }
  }
}
