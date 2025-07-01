import { Logger } from '@nestjs/common';
import {
    IStressTestStrategy,
    StressTestExecutionConfig,
    StressTestExecutionResult,
    StressTestType
} from '../types/stress-test.interface';

export abstract class BaseStressTestStrategy implements IStressTestStrategy {
    protected readonly logger = new Logger(this.constructor.name);

    abstract execute(config: StressTestExecutionConfig): Promise<StressTestExecutionResult>;
    abstract getName(): string;
    abstract getDescription(): string;
    abstract getSupportedTestType(): StressTestType;

    validateConfig(config: StressTestExecutionConfig): boolean {
        if (!config) {
            this.logger.error('Configuration is required');
            return false;
        }

        if (!config.testType) {
            this.logger.error('Test type is required');
            return false;
        }

        if (config.testType !== this.getSupportedTestType()) {
            this.logger.error(`Invalid test type. Expected: ${this.getSupportedTestType()}, got: ${config.testType}`);
            return false;
        }

        return this.validateSpecificConfig(config);
    }

    protected abstract validateSpecificConfig(config: StressTestExecutionConfig): boolean;

    protected createSuccessResult(
        message: string,
        data?: any,
        metrics?: any
    ): StressTestExecutionResult {
        return {
            success: true,
            message,
            data,
            metrics
        };
    }

    protected createErrorResult(
        message: string,
        errors?: string[]
    ): StressTestExecutionResult {
        return {
            success: false,
            message,
            errors
        };
    }

    protected logExecution(config: StressTestExecutionConfig): void {
        this.logger.log(`Executing ${this.getName()} with config: ${JSON.stringify(config)}`);
    }

    protected logSuccess(result: StressTestExecutionResult): void {
        this.logger.log(`Successfully completed ${this.getName()}: ${result.message}`);
    }

    protected logError(error: any): void {
        this.logger.error(`Error in ${this.getName()}: ${error.message || error}`);
    }
} 