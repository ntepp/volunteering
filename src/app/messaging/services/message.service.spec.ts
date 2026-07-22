import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';

import { MessageService } from './message.service';
import { Message, ThreadSummary } from '../../models/message.model';
import { environment } from '../../../environments/environment';

describe('MessageService', () => {
  let service: MessageService;
  let httpMock: HttpTestingController;
  const base = environment.apiApplicationUrl + '/api/applications';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(MessageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getThread appelle GET /{id}/messages', () => {
    service.getThread(10).subscribe((msgs: Message[]) => expect(msgs.length).toBe(1));
    const req = httpMock.expectOne(`${base}/10/messages`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, candidatureId: 10, senderId: '7', senderRole: 'ORGANIZATION', content: 'Bonjour', sentAt: '2026-07-18T10:00:00' }]);
  });

  it('sendMessage poste le contenu', () => {
    service.sendMessage(10, 'Bonjour').subscribe();
    const req = httpMock.expectOne(`${base}/10/messages`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ content: 'Bonjour' });
    req.flush({ id: 2, candidatureId: 10, senderId: '7', senderRole: 'ORGANIZATION', content: 'Bonjour', sentAt: '2026-07-18T10:00:00' });
  });

  it('getSummary appelle GET /messages/summary', () => {
    service.getSummary().subscribe((s: ThreadSummary[]) => expect(s[0].unreadCount).toBe(2));
    const req = httpMock.expectOne(`${base}/messages/summary`);
    req.flush([{ candidatureId: 10, unreadCount: 2, lastMessageAt: '2026-07-18T10:00:00' }]);
  });

  it('mappe une 409 sur le message serveur', (done) => {
    service.sendMessage(10, 'x').subscribe({
      error: (e: Error) => {
        expect(e.message).toContain('Candidature clôturée');
        done();
      }
    });
    httpMock.expectOne(`${base}/10/messages`)
      .flush({ message: 'Candidature clôturée — le fil est en lecture seule' }, { status: 409, statusText: 'Conflict' });
  });
});
