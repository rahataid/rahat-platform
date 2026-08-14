import { Controller, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HealthService } from '../health/health.service';

@Controller('cron')
export class CronController implements OnApplicationBootstrap {
    constructor(private readonly healthService: HealthService,
    ) { }

    async onApplicationBootstrap() {
        await this.healthService.checkHealthStatus();
    }

    @Cron(CronExpression.EVERY_10_MINUTES)
    handleCron() {
        this.healthService.checkHealthStatus();
    }
}
