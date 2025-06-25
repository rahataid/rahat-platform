import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('stress-test-queue')
export class TestJobProcessor {
    private readonly logger = new Logger(TestJobProcessor.name);

    @Process('stress-test-job')
    async handleStressTestJob(job: Job): Promise<any> {
        const { testId, jobType, processingTime, timestamp } = job.data;

        const startTime = Date.now();

        await this.delay(processingTime || 100);

        const endTime = Date.now();
        const actualProcessingTime = endTime - startTime;
        const queueWaitTime = startTime - timestamp;

        this.logger.debug(`Job ${job.id} completed in ${actualProcessingTime}ms (waited ${queueWaitTime}ms in queue)`);

        return {
            jobId: job.id,
            testId,
            jobType,
            processingTime: actualProcessingTime,
            queueWaitTime,
            completed: true,
        };
    }

    @Process('memory-pressure-job')
    async handleMemoryPressureJob(job: Job): Promise<any> {
        const { testId, payload, index } = job.data;

        // Process large payload
        const processed = payload.length;

        this.logger.debug(`Memory pressure job ${index} processed ${processed} bytes`);

        return { processed, index, testId };
    }

    @Process('error-test-job')
    async handleErrorTestJob(job: Job): Promise<any> {
        const { testId, shouldFail, index } = job.data;

        if (shouldFail) {
            throw new Error(`Intentional error for test ${testId}, job ${index}`);
        }

        return { testId, index, success: true };
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
