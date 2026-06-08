import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { getClient } from '@rumsan/connect/src/clients';
import { AppService } from '../app/app.service';

export type CommsClient = ReturnType<typeof getClient>;

@Injectable()
export class CommsService {
  private client: CommsClient | null = null;
  private logger = new Logger(CommsService.name);

  constructor(
    private readonly appService: AppService,
  ) { }

  // Initialize the communication client on service startup
  private isReady = false;

  async init() {
    const communicationSettings = await this.appService.getCommunicationSettings();
    const communicationValue = communicationSettings[0]?.value as Record<string, unknown> | undefined;

    if (!communicationSettings?.length || !communicationValue) {
      this.isReady = false;
      this.client = null;
      this.logger.warn('[CommsService] Waiting for settings deployment...');
      return;
    }

    this.client = getClient({
      baseURL: String(communicationValue['URL'] ?? ''),
    });
    this.client.setAppId(String(communicationValue['APP_ID'] ?? ''));
    this.isReady = true;
  }

  @OnEvent('settings.seeded')
  async handleSettingsSeeded() {
    this.logger.log('[CommsService] settings.seeded received. Re-initializing communication client...');
    await this.init();
  }

  async getClient(): Promise<CommsClient> {
    if (!this.isReady || !this.client) {
      throw new ServiceUnavailableException('Communication service is not initialized yet. Seed settings and try again.');
    }
    return this.client;
  }
}
