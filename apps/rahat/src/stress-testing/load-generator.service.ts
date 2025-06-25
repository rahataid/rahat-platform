import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { JobType, StressTestConfig } from './types/stress-test.interface';

@Injectable()
export class LoadGeneratorService {
    private readonly logger = new Logger(LoadGeneratorService.name);

    constructor(
        @InjectQueue('stress-test-queue') private stressTestQueue: Queue,
        @InjectQueue('high-priority-queue') private highPriorityQueue: Queue,
        @InjectQueue('low-priority-queue') private lowPriorityQueue: Queue,
    ) { }

    async generateRealisticLoad(config: StressTestConfig, testId: string): Promise<void> {
        this.logger.log(`Generating realistic load pattern for test: ${testId}`);
        const patterns = [
            { name: 'morning_peak', multiplier: 1.5, duration: 30 }, // 30 seconds
            { name: 'normal_load', multiplier: 1.0, duration: 60 },
            { name: 'lunch_dip', multiplier: 0.7, duration: 20 },
            { name: 'afternoon_peak', multiplier: 1.8, duration: 40 },
            { name: 'evening_decline', multiplier: 0.9, duration: 30 },
        ];

        for (const pattern of patterns) {
            await this.executePattern(pattern, config, testId);
        }
    }

    private async executePattern(
        pattern: { name: string; multiplier: number; duration: number },
        config: StressTestConfig,
        testId: string,
    ): Promise<void> {
        this.logger.log(`Executing pattern: ${pattern.name} (${pattern.multiplier}x for ${pattern.duration}s)`);

        const adjustedThroughput = Math.floor(config.targetThroughput * pattern.multiplier);
        const endTime = Date.now() + (pattern.duration * 1000);

        while (Date.now() < endTime) {
            const batchStart = Date.now();

            // Generate jobs with realistic distribution
            await this.generateJobBatch(adjustedThroughput, config.jobTypes, testId);

            // Maintain target rate
            const elapsed = Date.now() - batchStart;
            const delay = Math.max(0, 1000 - elapsed);

            if (delay > 0) {
                await this.delay(delay);
            }
        }
    }

    async generateBurstLoad(intensity: number, duration: number, testId: string): Promise<void> {
        this.logger.log(`Generating burst load: intensity=${intensity} jobs/sec, duration=${duration}ms`);

        const endTime = Date.now() + duration;
        let jobCounter = 0;

        while (Date.now() < endTime) {
            const batchPromises: Promise<any>[] = [];

            // Generate burst of jobs
            for (let i = 0; i < intensity; i++) {
                const jobData = {
                    testId,
                    jobType: 'burst-job',
                    payload: this.generateRandomPayload(),
                    processingTime: this.getRandomProcessingTime(),
                    timestamp: Date.now(),
                    batchIndex: jobCounter++,
                };

                const promise = this.stressTestQueue.add('stress-test-job', jobData, {
                    priority: Math.floor(Math.random() * 10) + 1,
                    removeOnComplete: 5,
                    removeOnFail: 5,
                });

                batchPromises.push(promise);
            }

            await Promise.all(batchPromises);
            await this.delay(1000); // Wait 1 second between bursts
        }
    }

    async generateSpikeyLoad(config: StressTestConfig, testId: string): Promise<void> {
        this.logger.log(`Generating spikey load pattern for test: ${testId}`);

        // Simulate unpredictable traffic spikes
        const spikes = [
            { intensity: config.targetThroughput * 3, duration: 5000 },  // 3x spike for 5s
            { intensity: config.targetThroughput * 0.2, duration: 10000 }, // Low period for 10s
            { intensity: config.targetThroughput * 5, duration: 3000 },  // 5x spike for 3s
            { intensity: config.targetThroughput * 1, duration: 15000 }, // Normal for 15s
            { intensity: config.targetThroughput * 8, duration: 2000 },  // 8x spike for 2s
        ];

        for (const spike of spikes) {
            await this.generateBurstLoad(spike.intensity, spike.duration, testId);
        }
    }

    async generateGradualRampUp(
        startRate: number,
        endRate: number,
        duration: number,
        testId: string,
    ): Promise<void> {
        this.logger.log(`Gradual ramp-up: ${startRate} → ${endRate} over ${duration}ms`);

        const steps = 20; // Number of steps in ramp-up
        const stepDuration = duration / steps;
        const rateIncrement = (endRate - startRate) / steps;

        for (let step = 0; step < steps; step++) {
            const currentRate = Math.floor(startRate + (rateIncrement * step));

            this.logger.debug(`Ramp-up step ${step + 1}/${steps}: ${currentRate} jobs/sec`);

            await this.generateBurstLoad(currentRate, stepDuration, testId);
        }
    }

    private async generateJobBatch(
        jobsPerSecond: number,
        jobTypes: JobType[],
        testId: string,
    ): Promise<void> {
        const jobPromises: Promise<any>[] = [];

        for (let i = 0; i < jobsPerSecond; i++) {
            const jobType = this.selectJobType(jobTypes);
            const queue = this.selectQueue(jobType.priority);

            const jobData = {
                testId,
                jobType: jobType.name,
                payload: this.generatePayload(jobType.payloadSize),
                processingTime: this.addVariability(jobType.processingTime),
                timestamp: Date.now(),
                priority: jobType.priority,
            };

            const jobPromise = queue.add('stress-test-job', jobData, {
                priority: jobType.priority,
                delay: this.getRandomDelay(), // Add realistic timing variation
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
            });

            jobPromises.push(jobPromise);
        }

        await Promise.all(jobPromises);
    }

    private selectJobType(jobTypes: JobType[]): JobType {
        const totalWeight = jobTypes.reduce((sum, job) => sum + job.weight, 0);
        const random = Math.random() * totalWeight;

        let currentWeight = 0;
        for (const jobType of jobTypes) {
            currentWeight += jobType.weight;
            if (random <= currentWeight) {
                return jobType;
            }
        }

        return jobTypes[0]; // fallback
    }

    private selectQueue(priority: number): Queue {
        if (priority >= 8) return this.highPriorityQueue;
        if (priority <= 3) return this.lowPriorityQueue;
        return this.stressTestQueue;
    }

    private generatePayload(size: number): string {
        // Generate more realistic payload with JSON structure
        const basePayload = {
            id: this.generateUUID(),
            timestamp: Date.now(),
            data: 'x'.repeat(Math.max(0, size - 200)), // Reserve space for metadata
            metadata: {
                version: '1.0',
                source: 'stress-test',
                random: Math.random(),
            },
        };

        return JSON.stringify(basePayload);
    }

    private generateRandomPayload(): string {
        const sizes = [512, 1024, 2048, 4096, 8192];
        const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
        return this.generatePayload(randomSize);
    }

    private addVariability(baseTime: number): number {
        // Add ±20% variability to processing time to simulate real-world conditions
        const variance = 0.2;
        const multiplier = 1 + ((Math.random() - 0.5) * 2 * variance);
        return Math.floor(baseTime * multiplier);
    }

    private getRandomProcessingTime(): number {
        // Simulate realistic processing time distribution
        const times = [50, 100, 200, 500, 1000, 2000];
        const weights = [30, 40, 20, 5, 3, 2]; // Most jobs are fast

        return this.weightedRandom(times, weights);
    }

    private getRandomDelay(): number {
        // Add small random delays to simulate network latency
        return Math.floor(Math.random() * 100); // 0-100ms delay
    }

    private weightedRandom(items: number[], weights: number[]): number {
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        const random = Math.random() * totalWeight;

        let currentWeight = 0;
        for (let i = 0; i < items.length; i++) {
            currentWeight += weights[i];
            if (random <= currentWeight) {
                return items[i];
            }
        }

        return items[0];
    }

    private generateUUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Additional method for testing different load scenarios
    async runLoadScenario(
        scenario: 'realistic' | 'burst' | 'spikey' | 'ramp-up',
        config: StressTestConfig,
        testId: string,
        options?: any,
    ): Promise<void> {
        switch (scenario) {
            case 'realistic':
                await this.generateRealisticLoad(config, testId);
                break;
            case 'burst':
                await this.generateBurstLoad(
                    options?.intensity || config.targetThroughput * 2,
                    options?.duration || 10000,
                    testId,
                );
                break;
            case 'spikey':
                await this.generateSpikeyLoad(config, testId);
                break;
            case 'ramp-up':
                await this.generateGradualRampUp(
                    options?.startRate || 10,
                    options?.endRate || config.targetThroughput,
                    options?.duration || 60000,
                    testId,
                );
                break;
            default:
                throw new Error(`Unknown load scenario: ${scenario}`);
        }
    }
}