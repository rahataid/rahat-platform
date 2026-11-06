import { GUARDS_METADATA } from '@nestjs/common/constants';
import { CHECK_HEADERS_KEY } from '../decorators/headers.decorator';
import { ExternalAppGuard } from '../decorators/external.app.guard';
import { WebhooksController } from './webhooks.controller';

describe('WebhooksController authentication', () => {
  const connectSession = WebhooksController.prototype.connectSession;

  it('requires the signed external-app guard and auth headers', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, connectSession)).toContain(
      ExternalAppGuard
    );
    expect(Reflect.getMetadata(CHECK_HEADERS_KEY, connectSession)).toEqual([
      'Signature',
    ]);
  });
});
