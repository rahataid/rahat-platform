import {
  BadRequestException,
  GatewayTimeoutException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ProjectJobs } from '@rahataid/sdk';
import { firstValueFrom, timeout } from 'rxjs';

const FORWARD_TIMEOUT_MS = 8000;

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(@Inject('RAHAT_CLIENT') private readonly client: ClientProxy) {}

  async forwardConnectSessionWebhook(payload: Record<string, any>) {
    const sessionCuid = payload?.sessionCuid;
    const xref = payload?.xref;

    if (!sessionCuid || !xref) {
      throw new BadRequestException(
        'Webhook payload must include sessionCuid and xref'
      );
    }

    this.logger.log(
      `Forwarding connect webhook for session ${sessionCuid} to project ${xref}`
    );

    try {
      return await firstValueFrom(
        this.client
          .send(
            { cmd: ProjectJobs.CAMPAIGN.HANDLE_SESSION_WEBHOOK, uuid: xref },
            payload
          )
          .pipe(timeout(FORWARD_TIMEOUT_MS))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(
        `Failed to forward session webhook for ${sessionCuid} (project ${xref}): ${message}`
      );

      if ((err as { name?: string })?.name === 'TimeoutError') {
        throw new GatewayTimeoutException('Project did not respond in time');
      }
      throw new InternalServerErrorException(
        'Failed to process session webhook'
      );
    }
  }
}
