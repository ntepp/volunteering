import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

interface Notification {
  id: number;
  message: string;
  date: Date;
  read: boolean;
  icon: string;
}

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatCardModule],
  templateUrl: './notification-list.component.html',
  styleUrl: './notification-list.component.css'
})
export class NotificationListComponent {
  notifications: Notification[] = [];

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markAllRead(): void {
    this.notifications.forEach(n => n.read = true);
  }

  markRead(n: Notification): void {
    n.read = true;
  }
}
