import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BeneficiaryConstants } from '@rahataid/sdk';
import { LoadGeneratorService } from './load-generator.service';
import { MetricsService } from './metrics.service';
import { StressTestingController } from './stress-testing.controller';
import { StressTestingService } from './stress-testing.service';
import { TestJobProcessor } from './test-job.processor';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: BeneficiaryConstants.Client,
                transport: Transport.REDIS,
                options: {
                    host: process.env.REDIS_HOST,
                    port: +process.env.REDIS_PORT,
                    password: process.env.REDIS_PASSWORD,
                    retryAttempts: 10,
                    retryDelay: 2000,
                },
            },
        ]),
        BullModule.registerQueue(
            { name: 'stress-test-queue' },
            { name: 'high-priority-queue' },
            { name: 'low-priority-queue' },
        ),
    ],
    providers: [
        StressTestingService,
        MetricsService,
        LoadGeneratorService,
        TestJobProcessor,
    ],
    controllers: [StressTestingController],
    exports: [StressTestingService, MetricsService],
})
export class StressTestingModule { }
