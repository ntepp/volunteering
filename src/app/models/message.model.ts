export type SenderRole = 'ORGANIZATION' | 'VOLUNTEER';

export interface Message {
  id: number;
  candidatureId: number;
  senderId: string;
  senderRole: SenderRole;
  content: string;
  sentAt: string;
  readAt?: string | null;
}

export interface ThreadSummary {
  candidatureId: number;
  unreadCount: number;
  lastMessageAt: string;
}
