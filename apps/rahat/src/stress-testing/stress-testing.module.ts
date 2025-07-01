import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { BeneficiaryConstants } from '@rahataid/sdk';
import { StressTestStrategyFactory } from './factories/stress-test-strategy.factory';
import { BeneficiaryImportStrategy } from './strategies/beneficiary-import.strategy';
import { StressTestingController } from './stress-testing.controller';
import { StressTestingService } from './stress-testing.service';

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
    ],
    providers: [
        StressTestingService,
        StressTestStrategyFactory,
        // Register all strategy implementations
        BeneficiaryImportStrategy,
        // Future strategies can be added here:
        // VendorManagementStrategy,
        // TransactionProcessingStrategy,
        // ApiLoadTestStrategy,
        // DatabaseStressStrategy,
    ],
    controllers: [StressTestingController],
    exports: [
        StressTestingService,
        StressTestStrategyFactory,
    ],
})
export class StressTestingModule { }
