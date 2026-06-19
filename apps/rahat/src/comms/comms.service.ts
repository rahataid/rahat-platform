import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { getClient } from '@rumsan/connect/src/clients';
import { AppService } from '../app/app.service';

export type CommsClient = ReturnType<typeof getClient>;

@Injectable()
export class CommsService {
  private client: CommsClient | null = null;
  private appId: string | null = null;
  private isReady = false;
  private logger = new Logger(CommsService.name);

  constructor(
    private readonly appService: AppService,
  ) { }

  async init() {
    const communicationSettings = await this.appService.getCommunicationSettings();
    const communicationValue = communicationSettings[0]?.value as Record<string, unknown> | undefined;

    if (!communicationSettings?.length || !communicationValue) {
      this.isReady = false;
      this.client = null;
      this.appId = null;
      this.logger.warn('[CommsService] Waiting for settings deployment...');
      return;
    }

    this.appId = String(communicationValue['APP_ID'] ?? '');
    this.client = getClient({
      baseURL: String(communicationValue['URL'] ?? ''),
    });
    console.log(communicationValue['URL'], communicationValue['APP_ID']);
    this.client.setAppId(this.appId);
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

  private getAppId(): string {
    if (!this.isReady || !this.appId) {
      throw new ServiceUnavailableException('Communication service is not initialized yet. Seed settings and try again.');
    }
    return this.appId;
  }

  async listTransports() {
    const client = await this.getClient();
    console.log(client.transport);
    return client.transport.list();
  }

  async getUsage(params?: { from?: string; to?: string }) {
    const client = await this.getClient();
    return client.usage.getUsage(this.getAppId(), params);
  }

  async getUsageByXref(xref: string, params?: { from?: string; to?: string }) {
    const client = await this.getClient();
    return client.usage.getUsageByXref(this.getAppId(), xref, params);
  }

  async getCredits(params?: { from?: string; to?: string }) {
    const client = await this.getClient();
    return client.usage.getCredits(this.getAppId(), params);
  }

  async getCreditsByXref(xref: string, params?: { from?: string; to?: string }) {
    const client = await this.getClient();
    return client.usage.getCreditsByXref(this.getAppId(), xref, params);
  }

  async getReport(filter: { xref?: string }) {
    const client = await this.getClient();
    return client.broadcast.getReport(filter);
  }
}
