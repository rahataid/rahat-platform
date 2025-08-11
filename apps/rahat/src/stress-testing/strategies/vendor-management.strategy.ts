import { Injectable } from '@nestjs/common';
import {
    StressTestExecutionConfig,
    StressTestExecutionResult,
    StressTestType
} from '../types/stress-test.interface';
import { BaseStressTestStrategy } from './base-stress-test.strategy';

// Example interface for vendor management stress test
interface VendorManagementConfig {
    numberOfVendors: number;
    vendorType?: 'INDIVIDUAL' | 'ORGANIZATION' | 'MIXED';
    includeKYC?: boolean;
    simulateApprovalProcess?: boolean;
}

@Injectable()
export class VendorManagementStrategy extends BaseStressTestStrategy {

    getName(): string {
        return 'Vendor Management Stress Test';
    }

    getDescription(): string {
        return 'Stress tests vendor registration, KYC processing, and approval workflows';
    }

    getSupportedTestType(): StressTestType {
        return StressTestType.VENDOR_MANAGEMENT;
    }

    protected validateSpecificConfig(config: StressTestExecutionConfig): boolean {
        const params = config.parameters as VendorManagementConfig;

        if (!params.numberOfVendors || params.numberOfVendors <= 0) {
            this.logger.error('numberOfVendors must be a positive number');
            return false;
        }

        if (params.numberOfVendors > 1000) {
            this.logger.warn('numberOfVendors exceeds recommended limit of 1,000');
        }

        if (params.vendorType && !['INDIVIDUAL', 'ORGANIZATION', 'MIXED'].includes(params.vendorType)) {
            this.logger.error('vendorType must be INDIVIDUAL, ORGANIZATION, or MIXED');
            return false;
        }

        return true;
    }

    async execute(config: StressTestExecutionConfig): Promise<StressTestExecutionResult> {
        this.logExecution(config);

        try {
            const params = config.parameters as VendorManagementConfig;
            const startTime = Date.now();

            // Simulate vendor management operations
            this.logger.log(`Creating ${params.numberOfVendors} test vendors...`);

            // Here you would implement actual vendor creation logic
            // For now, we'll simulate the process
            await this.simulateVendorCreation(params);

            const executionTime = Date.now() - startTime;
            const result = this.createSuccessResult(
                `Successfully processed ${params.numberOfVendors} vendors`,
                {
                    numberOfVendors: params.numberOfVendors,
                    vendorType: params.vendorType || 'MIXED',
                    includeKYC: params.includeKYC || false,
                    executionTime
                },
                {
                    totalJobsSubmitted: params.numberOfVendors,
                    totalJobsCompleted: params.numberOfVendors,
                    averageProcessingTime: executionTime / params.numberOfVendors
                }
            );

            this.logSuccess(result);
            return result;

        } catch (error) {
            this.logError(error);
            return this.createErrorResult(
                `Failed to process vendors: ${error.message}`,
                [error.message]
            );
        }
    }

    private async simulateVendorCreation(params: VendorManagementConfig): Promise<void> {
        // Simulate vendor creation process
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        for (let i = 0; i < params.numberOfVendors; i++) {
            // Simulate processing time per vendor
            await delay(10);

            if (i % 100 === 0) {
                this.logger.log(`Processed ${i}/${params.numberOfVendors} vendors`);
            }
        }

        this.logger.log(`Completed processing ${params.numberOfVendors} vendors`);
    }
} 