import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { MessageStateService } from './message-state.service';
import { MessageService } from './message.service';
import { AuthService } from '../../auth/services/auth.service';

describe('MessageStateService', () => {
  const messageServiceSpy = jasmine.createSpyObj('MessageService', ['getSummary']);
  const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: MessageService, useValue: messageServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });
    authServiceSpy.isAuthenticated.and.returnValue(true);
    messageServiceSpy.getSummary.and.returnValue(of([
      { candidatureId: 10, unreadCount: 2, lastMessageAt: '2026-07-18T10:00:00' },
      { candidatureId: 11, unreadCount: 1, lastMessageAt: '2026-07-18T11:00:00' }
    ]));
  });

  it('refresh agrège le total de non-lus', (done) => {
    const service = TestBed.inject(MessageStateService);
    service.refresh();
    service.unreadTotal$.subscribe((total: number) => {
      expect(total).toBe(3);
      done();
    });
  });

  it('refresh remet à zéro si non authentifié', (done) => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    const service = TestBed.inject(MessageStateService);
    service.refresh();
    service.unreadTotal$.subscribe((total: number) => {
      expect(total).toBe(0);
      done();
    });
  });
});
