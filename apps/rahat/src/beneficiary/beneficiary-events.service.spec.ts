import { firstValueFrom, skip, take } from 'rxjs';
import {
  BeneficiaryChangeEvent,
  BeneficiaryEventsService,
} from './beneficiary-events.service';

describe('BeneficiaryEventsService', () => {
  let service: BeneficiaryEventsService;

  beforeEach(() => {
    service = new BeneficiaryEventsService();
  });

  it('sends an initial connection event and beneficiary changes', async () => {
    const event: BeneficiaryChangeEvent = {
      eventId: 'event-1',
      eventType: 'updated',
      beneficiaryUuids: ['beneficiary-1'],
      projectUuids: ['project-1'],
      projectUuid: 'project-1',
      occurredAt: new Date().toISOString(),
    };
    const stream = service.stream().pipe(take(1));
    const initialEvent = await firstValueFrom(stream);

    expect(initialEvent).toMatchObject({
      type: 'connected',
      retry: 3000,
    });

    const change = firstValueFrom(service.stream().pipe(skip(1), take(1)));
    service.publish(event);

    await expect(change).resolves.toMatchObject({
      id: event.eventId,
      type: event.eventType,
      data: event,
    });
  });

  it('filters beneficiary changes by project', async () => {
    const matchingEvent: BeneficiaryChangeEvent = {
      eventId: 'event-2',
      eventType: 'created',
      beneficiaryUuids: ['beneficiary-2'],
      projectUuids: ['project-2'],
      projectUuid: 'project-2',
      occurredAt: new Date().toISOString(),
    };
    const change = firstValueFrom(
      service.stream('project-2').pipe(skip(1), take(1))
    );

    service.publish({
      ...matchingEvent,
      eventId: 'other-project-event',
      projectUuid: 'project-1',
      projectUuids: ['project-1'],
    });
    service.publish(matchingEvent);

    await expect(change).resolves.toMatchObject({
      id: matchingEvent.eventId,
      data: matchingEvent,
    });
  });
});
