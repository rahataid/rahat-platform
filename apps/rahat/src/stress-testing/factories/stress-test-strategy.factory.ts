import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { BeneficiaryImportStrategy } from '../strategies/beneficiary-import.strategy';
import { IStressTestStrategy, StressTestType } from '../types/stress-test.interface';

@Injectable()
export class StressTestStrategyFactory {
    private readonly logger = new Logger(StressTestStrategyFactory.name);
    private readonly strategies = new Map<StressTestType, new (...args: any[]) => IStressTestStrategy>();

    constructor(private readonly moduleRef: ModuleRef) {
        this.registerStrategies();
    }

    private registerStrategies(): void {
        // Register all available strategies
        this.strategies.set(StressTestType.BENEFICIARY_IMPORT, BeneficiaryImportStrategy);

        // Future strategies can be registered here:
        // this.strategies.set(StressTestType.VENDOR_MANAGEMENT, VendorManagementStrategy);
        // this.strategies.set(StressTestType.TRANSACTION_PROCESSING, TransactionProcessingStrategy);
        // this.strategies.set(StressTestType.API_LOAD_TEST, ApiLoadTestStrategy);
        // this.strategies.set(StressTestType.DATABASE_STRESS, DatabaseStressStrategy);
    }

    async createStrategy(testType: StressTestType): Promise<IStressTestStrategy> {
        const StrategyClass = this.strategies.get(testType);

        if (!StrategyClass) {
            const availableTypes = Array.from(this.strategies.keys()).join(', ');
            throw new Error(
                `No strategy found for test type: ${testType}. Available types: ${availableTypes}`
            );
        }

        try {
            // Use ModuleRef to get the strategy instance with proper dependency injection
            const strategy = await this.moduleRef.get(StrategyClass, { strict: false });
            this.logger.log(`Created strategy for test type: ${testType}`);
            return strategy;
        } catch (error) {
            this.logger.error(`Failed to create strategy for ${testType}: ${error.message}`);
            throw new Error(`Failed to create strategy for ${testType}: ${error.message}`);
        }
    }

    getSupportedTestTypes(): StressTestType[] {
        return Array.from(this.strategies.keys());
    }

    getStrategyInfo(): { type: StressTestType; name: string; description: string }[] {
        // Note: This method creates temporary instances just to get info
        // In a production environment, you might want to store this info statically
        return Array.from(this.strategies.entries()).map(([type, StrategyClass]) => {
            // Create a temporary instance to get name and description
            // This is not ideal but works for getting basic info
            return {
                type,
                name: type.toString(), // Fallback, should be improved
                description: `Strategy for ${type}` // Fallback, should be improved
            };
        });
    }
} 