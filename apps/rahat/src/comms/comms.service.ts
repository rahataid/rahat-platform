import { Injectable, Logger } from '@nestjs/common';
import { getClient } from '@rumsan/connect/src/clients';
import { AppService } from '../app/app.service';

const GET_COMMUNICATION_SETTINGS = 'appJobs.communication.getSettings';

export type CommsClient = ReturnType<typeof getClient>;

@Injectable()
export class CommsService {
  private client: CommsClient;
  private logger = new Logger(CommsService.name);

  constructor(
    private readonly appService: AppService,

  ) { }

  async init() {

    const communicationSettings = await this.appService.getCommunicationSettings()

    this.logger.log('Communication Settings:', communicationSettings);

    if (!communicationSettings) {
      this.logger.error('Communication Settings not found.');
      process.exit(1);
    }
    this.client = getClient({
      baseURL: communicationSettings[0]?.value["URL"],
    });
    this.client.setAppId(communicationSettings[0]?.value['APP_ID']);
  }

  async getClient(): Promise<any> {
    if (!this.client) {
      await this.init();
      return this.client;
    }
    return this.client;
  }
}
