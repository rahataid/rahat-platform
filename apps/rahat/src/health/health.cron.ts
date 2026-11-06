import {
  Injectable,
  Logger,
  OnApplicationBootstrap
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HealthService } from './health.service';

@Injectable()
export class HealthCron implements OnApplicationBootstrap {
  private readonly logger = new Logger(HealthCron.name);

  constructor(private readonly healthService: HealthService) {}

  onApplicationBootstrap() {
    this.logger.log('Starting initial health check in background');
    void this.runHealthCheck('Initial');
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron(): Promise<void> {
    await this.runHealthCheck('Scheduled');
  }

  private async runHealthCheck(source: string): Promise<void> {
    this.logger.log(`${source} health check started`);
    try {
      const result = await this.healthService.checkHealthStatus();
      this.logger.log(`${source} health check completed: ${result.status}`);
    } catch (error) {
      this.logger.error(`${source} health check failed`, error);
    }
  }
}
