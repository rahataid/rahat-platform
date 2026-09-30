import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthModule } from '../health/health.module';
import { CronController } from './cron.controller';

@Module({
    imports: [ScheduleModule.forRoot(), HealthModule],
    controllers: [CronController],
})
export class CronModule { }
