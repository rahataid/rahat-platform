import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NewRelicService {
  private readonly logger = new Logger(NewRelicService.name);

  constructor() {
    this.initializeNewRelic();
  }

  private initializeNewRelic(): void {
    if (!process.env.NEW_RELIC_LICENSE_KEY) {
      this.logger.log('New Relic monitoring disabled (no license key configured)');
      return;
    }

    try {
      require('newrelic');
      this.logger.log('✅ New Relic agent initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize New Relic: ${error.message}`);
      // Continue running even if New Relic fails
    }
  }

  /**
   * Check if New Relic is enabled
   */
  isEnabled(): boolean {
    return !!process.env.NEW_RELIC_LICENSE_KEY;
  }

  /**
   * Get New Relic configuration
   */
  getConfig(): Record<string, any> {
    return {
      licenseKey: process.env.NEW_RELIC_LICENSE_KEY ? '***' : 'disabled',
      appName: process.env.NEW_RELIC_APP_NAME || 'Rahat Platform',
      logLevel: process.env.NEW_RELIC_LOG_LEVEL || 'info',
      enabled: this.isEnabled(),
    };
  }
}
