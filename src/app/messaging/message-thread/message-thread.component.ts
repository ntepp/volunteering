import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, timer } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';

import { MessageService } from '../services/message.service';
import { CandidatureService } from '../../opportunity/services/candidature.service';
import { AuthService } from '../../auth/services/auth.service';
import { Message } from '../../models/message.model';

const POLL_INTERVAL_MS = 20_000;

@Component({
  selector: 'app-message-thread',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './message-thread.component.html',
  styleUrl: './message-thread.component.css'
})
export class MessageThreadComponent implements OnInit, OnDestroy {

  candidatureId!: number;
  messages: Message[] = [];
  draft = '';
  readOnly = false;
  loading = true;
  sending = false;
  errorMessage = '';
  opportunityId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private candidatureService: CandidatureService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    this.candidatureId = Number(this.route.snapshot.paramMap.get('candidatureId'));

    this.candidatureService.getApplication(this.candidatureId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (app) => {
          this.readOnly = app.status === 'REJECTED' || app.status === 'CLOSED';
          this.opportunityId = app.opportunityId ?? null;
        },
        error: (e: Error) => this.errorMessage = e.message
      });

    // Chargement immédiat, puis polling léger tant que la page est ouverte
    this.loadThread();
    timer(POLL_INTERVAL_MS, POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => this.messageService.getThread(this.candidatureId)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (messages) => this.messages = messages,
        error: (e: Error) => this.errorMessage = e.message
      });
  }

  private loadThread(): void {
    this.messageService.getThread(this.candidatureId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (messages) => {
          this.messages = messages;
          this.loading = false;
        },
        error: (e: Error) => {
          this.errorMessage = e.message;
          this.loading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isMine(message: Message): boolean {
    const userId = this.authService.getUserData()?.userId;
    return userId != null && userId === message.senderId;
  }

  get isVolunteer(): boolean {
    return this.authService.getUserRole()?.toUpperCase() === 'VOLUNTEER';
  }

  onSend(): void {
    const content = this.draft.trim();
    if (!content || this.sending || this.readOnly) {
      return;
    }
    this.sending = true;
    this.errorMessage = '';
    this.messageService.sendMessage(this.candidatureId, content)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sent) => {
          this.messages = [...this.messages, sent];
          this.draft = '';
          this.sending = false;
        },
        error: (e: Error) => {
          this.errorMessage = e.message;
          this.sending = false;
        }
      });
  }
}
