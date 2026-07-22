import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { MessageThreadComponent } from './message-thread.component';
import { MessageService } from '../services/message.service';
import { CandidatureService } from '../../opportunity/services/candidature.service';
import { AuthService } from '../../auth/services/auth.service';

describe('MessageThreadComponent', () => {
  let fixture: ComponentFixture<MessageThreadComponent>;
  let component: MessageThreadComponent;

  const messageServiceSpy = jasmine.createSpyObj('MessageService', ['getThread', 'sendMessage']);
  const candidatureServiceSpy = jasmine.createSpyObj('CandidatureService', ['getApplication']);
  const authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserData', 'getUserRole', 'isAuthenticated']);

  beforeEach(async () => {
    messageServiceSpy.getThread.and.returnValue(of([
      { id: 1, candidatureId: 10, senderId: '7', senderRole: 'ORGANIZATION', content: 'Bonjour Aline', sentAt: '2026-07-18T10:00:00' }
    ]));
    candidatureServiceSpy.getApplication.and.returnValue(of({ id: '10', status: 'PENDING', opportunityId: 'opp-1', volunteeringId: '42' }));
    authServiceSpy.getUserData.and.returnValue({ user: 'aline', role: 'VOLUNTEER', userId: '42' });
    authServiceSpy.getUserRole.and.returnValue('VOLUNTEER');
    authServiceSpy.isAuthenticated.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [MessageThreadComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MessageService, useValue: messageServiceSpy },
        { provide: CandidatureService, useValue: candidatureServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['candidatureId', '10']]) } } as any }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MessageThreadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('affiche le fil et identifie les messages reçus', () => {
    expect(component.messages.length).toBe(1);
    expect(component.isMine(component.messages[0])).toBeFalse();
    const bubble: HTMLElement = fixture.nativeElement.querySelector('.bubble');
    expect(bubble.textContent).toContain('Bonjour Aline');
  });

  it('readOnly est vrai quand la candidature est REJECTED', () => {
    candidatureServiceSpy.getApplication.and.returnValue(of({ id: '10', status: 'REJECTED', opportunityId: 'opp-1', volunteeringId: '42' }));
    component.ngOnInit();
    expect(component.readOnly).toBeTrue();
  });
});
