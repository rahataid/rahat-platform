import { Injectable, MessageEvent } from '@nestjs/common';
import { filter, interval, map, merge, Observable, of, Subject } from 'rxjs';

export interface BeneficiaryChangeEvent {
  eventId: string;
  eventType: 'created' | 'updated' | 'deleted' | 'removed';
  beneficiaryUuids: string[];
  projectUuids: string[];
  projectUuid?: string;
  occurredAt: string;
}

@Injectable()
export class BeneficiaryEventsService {
  private readonly changes = new Subject<BeneficiaryChangeEvent>();

  publish(event: BeneficiaryChangeEvent) {
    this.changes.next(event);
  }

  stream(projectUuid?: string): Observable<MessageEvent> {
    const changes = this.changes.pipe(
      filter(
        (event) =>
          !projectUuid ||
          event.projectUuid === projectUuid ||
          event.projectUuids?.includes(projectUuid)
      ),
      map(
        (event): MessageEvent => ({
          id: event.eventId,
          type: event.eventType,
          data: event,
          retry: 3000,
        })
      )
    );

    const heartbeats = interval(15000).pipe(
      map(
        (): MessageEvent => ({
          type: 'heartbeat',
          data: { occurredAt: new Date().toISOString() },
        })
      )
    );

    return merge(
      of<MessageEvent>({
        type: 'connected',
        data: { message: 'Beneficiary event stream connected' },
        retry: 3000,
      }),
      changes,
      heartbeats
    );
  }
}
