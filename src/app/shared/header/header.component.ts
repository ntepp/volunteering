import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { AuthService } from '../../auth/services/auth.service';
import { VolunteerProfileService } from '../../user/services/volunteer-profile.service';
import { OrgProfileService } from '../../user/services/org-profile.service';
import { NotificationStateService } from '../../notification/services/notification-state.service';
import { MessageStateService } from '../../messaging/services/message-state.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit, OnDestroy {

  isAuthenticated = false;
  userRole: string | null = null;
  displayName = '';
  avatarUrl: string | null = null;
  unreadCount = 0;
  messagesUnread = 0;
  isMenuOpen = false;
  isUserMenuOpen = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private volunteerProfileService: VolunteerProfileService,
    private orgProfileService: OrgProfileService,
    private notificationState: NotificationStateService,
    private messageState: MessageStateService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.authService.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(authenticated => {
        this.isAuthenticated = authenticated;
        this.userRole = authenticated ? this.authService.getUserRole() : null;
        this.displayName = '';
        this.avatarUrl = null;
        if (authenticated) {
          this.loadIdentity();
          this.notificationState.refresh();
          this.messageState.startPolling();
        } else {
          this.notificationState.setUnreadCount(0);
          this.messageState.stopPolling();
        }
      });

    this.notificationState.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => this.unreadCount = count);

    this.messageState.unreadTotal$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => this.messagesUnread = count);
  }

  get messagesLink(): string {
    return this.isOrganization ? '/volunteering/opportunities/my' : '/applications';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Charge le nom d'affichage et l'avatar selon le rôle. */
  private loadIdentity(): void {
    if (this.isVolunteer) {
      this.volunteerProfileService.getMyProfile()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (p) => {
            this.displayName = p.firstName || p.username || '';
            this.avatarUrl = p.profileImage ?? null;
          },
          error: () => {}
        });
    } else if (this.isOrganization) {
      const userId = this.authService.getUserData()?.userId;
      if (!userId) return;
      this.orgProfileService.getOrgById(String(userId))
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (p) => {
            this.displayName = p.orgName || '';
            this.avatarUrl = p.profileImage ?? null;
          },
          error: () => {}
        });
    }
  }

  get isVolunteer(): boolean {
    return this.userRole?.toUpperCase() === 'VOLUNTEER';
  }

  get isOrganization(): boolean {
    return this.userRole?.toUpperCase() === 'ORGANIZATION';
  }

  onLogout(): void {
    this.isUserMenuOpen = false;
    this.isMenuOpen = false;
    this.authService.logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        complete: () => this.router.navigate(['/']),
        error: () => this.router.navigate(['/'])
      });
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    this.isUserMenuOpen = false;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    this.isUserMenuOpen = false;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu-wrapper')) {
      this.isUserMenuOpen = false;
    }
  }

  onPublishOpportunity(): void {
    if (this.isOrganization) {
      this.router.navigate(['/volunteering/opportunities/create']);
    } else {
      this.router.navigate(['/register/organisation']);
    }
  }
}
