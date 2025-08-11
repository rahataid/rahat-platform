import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@rumsan/prisma';
import { StressTestStrategyFactory } from './factories/stress-test-strategy.factory';
import {
    BeneficiaryImportConfig,
    StressTestExecutionConfig,
    StressTestExecutionResult,
    StressTestType
} from './types/stress-test.interface';

@Injectable()
export class StressTestingService {
    private readonly logger = new Logger(StressTestingService.name);

    constructor(
        protected prisma: PrismaService,
        private readonly strategyFactory: StressTestStrategyFactory,
    ) { }

    /**
     * Executes a stress test using the appropriate strategy based on test type
     */
    async executeStressTest(config: StressTestExecutionConfig): Promise<StressTestExecutionResult> {
        this.logger.log(`Executing stress test: ${config.testType}`);

        try {
            // Get the appropriate strategy for the test type
            const strategy = await this.strategyFactory.createStrategy(config.testType);

            // Validate configuration
            if (!strategy.validateConfig(config)) {
                return {
                    success: false,
                    message: 'Invalid configuration provided',
                    errors: ['Configuration validation failed']
                };
            }

            // Execute the strategy
            const result = await strategy.execute(config);

            this.logger.log(`Stress test completed: ${config.testType}, Success: ${result.success}`);
            return result;

        } catch (error) {
            this.logger.error(`Stress test execution failed: ${error.message}`);
            return {
                success: false,
                message: `Stress test execution failed: ${error.message}`,
                errors: [error.message]
            };
        }
    }

    /**
     * Legacy method for backward compatibility - executes beneficiary import
     * @deprecated Use executeStressTest with StressTestType.BENEFICIARY_IMPORT instead
     */
    async executeBenfImport(legacyConfig: {
        numberOfBeneficiaries: number;
        groupName?: string;
    }): Promise<StressTestExecutionResult> {
        this.logger.warn('executeBenfImport is deprecated. Use executeStressTest instead.');

        const config: StressTestExecutionConfig = {
            testType: StressTestType.BENEFICIARY_IMPORT,
            parameters: {
                numberOfBeneficiaries: legacyConfig.numberOfBeneficiaries,
                groupName: legacyConfig.groupName,
                batchSize: 1,
                enableValidation: true,
                generateBankDetails: true
            } as BeneficiaryImportConfig
        };

        return this.executeStressTest(config);
    }

    /**
     * Gets all supported stress test types
     */
    getSupportedTestTypes(): StressTestType[] {
        return this.strategyFactory.getSupportedTestTypes();
    }

    /**
     * Gets information about all available strategies
     */
    getStrategyInfo() {
        return this.strategyFactory.getStrategyInfo();
    }

    /**
     * Validates a stress test configuration
     */
    async validateConfig(config: StressTestExecutionConfig): Promise<boolean> {
        try {
            const strategy = await this.strategyFactory.createStrategy(config.testType);
            return strategy.validateConfig(config);
        } catch (error) {
            this.logger.error(`Configuration validation failed: ${error.message}`);
            return false;
        }
    }
}
