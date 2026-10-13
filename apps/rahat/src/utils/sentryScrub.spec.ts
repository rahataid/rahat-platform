import type { ErrorEvent } from '@sentry/nestjs';
import { scrubSentryEvent } from './sentryScrub';

describe('scrubSentryEvent', () => {
  it('masks sensitive keys in request data, nested and in arrays', () => {
    const event = {
      request: {
        url: '/v1/projects',
        headers: { authorization: 'Bearer abc', accept: 'json' },
        data: {
          phone: '+8613800001111',
          beneficiaries: [{ fullName: 'Li Wei', ward: 4 }],
        },
      },
    } as unknown as ErrorEvent;

    const out = scrubSentryEvent(event) as any;
    expect(out.request.headers.authorization).toBe('[Filtered]');
    expect(out.request.headers.accept).toBe('json');
    expect(out.request.data.phone).toBe('[Filtered]');
    expect(out.request.data.beneficiaries[0].fullName).toBe('[Filtered]');
    expect(out.request.data.beneficiaries[0].ward).toBe(4);
    expect(out.request.url).toBe('/v1/projects');
  });

  it('masks extra, contexts and breadcrumb data but keeps harmless fields', () => {
    const event = {
      extra: { durationMs: 20000, projectUuid: 'p1', email: 'a@b.c' },
      contexts: { job: { id: 1, privateKey: '0xabc' } },
      breadcrumbs: [{ message: 'x', data: { token: 't', ok: true } }],
    } as unknown as ErrorEvent;

    const out = scrubSentryEvent(event) as any;
    expect(out.extra).toEqual({
      durationMs: 20000,
      projectUuid: 'p1',
      email: '[Filtered]',
    });
    expect(out.contexts.job).toEqual({ id: 1, privateKey: '[Filtered]' });
    expect(out.breadcrumbs[0].data).toEqual({ token: '[Filtered]', ok: true });
  });

  it('keeps SDK name fields but masks a person name', () => {
    const event = {
      contexts: {
        os: { name: 'Linux' },
        runtime: { name: 'node' },
        form: { name: 'Li Wei', firstName: 'Li' },
      },
    } as unknown as ErrorEvent;

    const out = scrubSentryEvent(event) as any;
    expect(out.contexts.os.name).toBe('Linux');
    expect(out.contexts.runtime.name).toBe('node');
    expect(out.contexts.form).toEqual({
      name: '[Filtered]',
      firstName: '[Filtered]',
    });
  });

  it('leaves an event with nothing to scrub untouched', () => {
    const event = { message: 'boom' } as unknown as ErrorEvent;
    expect(scrubSentryEvent(event)).toEqual({ message: 'boom' });
  });
});
