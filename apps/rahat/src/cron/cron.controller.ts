import { Controller } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HealthService } from '../health/health.service';

@Controller('cron')
export class CronController {
    constructor(private readonly healthService: HealthService) { }

    @Cron(CronExpression.EVERY_10_MINUTES)
    handleCron() {
        this.healthService.checkHealthStatus();
    }
}
