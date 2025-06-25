// metrics.service.ts
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { RedisMetrics, TestMetrics } from './types/stress-test.interface';

@Injectable()
export class MetricsService {
    private readonly logger = new Logger(MetricsService.name);
    private metrics = new Map<string, TestMetrics>();

    constructor(
        @InjectQueue('stress-test-queue') private stressTestQueue: Queue,
        @InjectQueue('high-priority-queue') private highPriorityQueue: Queue,
        @InjectQueue('low-priority-queue') private lowPriorityQueue: Queue,
    ) { }

    startCollection(testId: string): NodeJS.Timeout {
        this.logger.log(`Starting metrics collection for test: ${testId}`);

        return setInterval(async () => {
            await this.collectMetrics(testId);
        }, 1000);
    }

    private async collectMetrics(testId: string): Promise<void> {
        try {
            const queueMetrics = await this.collectQueueMetrics();
            const redisMetrics = await this.collectRedisMetrics();

            // Update test metrics
            let testMetrics = this.metrics.get(testId);
            if (!testMetrics) {
                testMetrics = this.initializeTestMetrics();
                this.metrics.set(testId, testMetrics);
            }

            // Update current metrics
            testMetrics.redisMetrics = redisMetrics;
            testMetrics.queueDepthPeak = Math.max(
                testMetrics.queueDepthPeak,
                queueMetrics.waiting + queueMetrics.active
            );
            testMetrics.memoryUsagePeak = Math.max(
                testMetrics.memoryUsagePeak,
                redisMetrics.memoryUsage
            );

        } catch (error) {
            this.logger.error(`Error collecting metrics: ${error.message}`);
        }
    }

    private async collectQueueMetrics() {
        const [waiting, active, completed, failed] = await Promise.all([
            this.stressTestQueue.getWaiting(),
            this.stressTestQueue.getActive(),
            this.stressTestQueue.getCompleted(),
            this.stressTestQueue.getFailed(),
        ]);

        // Also collect metrics from other queues
        const [
            highPriorityWaiting,
            highPriorityActive,
            lowPriorityWaiting,
            lowPriorityActive,
        ] = await Promise.all([
            this.highPriorityQueue.getWaiting(),
            this.highPriorityQueue.getActive(),
            this.lowPriorityQueue.getWaiting(),
            this.lowPriorityQueue.getActive(),
        ]);

        return {
            waiting: waiting.length + highPriorityWaiting.length + lowPriorityWaiting.length,
            active: active.length + highPriorityActive.length + lowPriorityActive.length,
            completed: completed.length,
            failed: failed.length,
            queues: {
                stressTest: {
                    waiting: waiting.length,
                    active: active.length,
                },
                highPriority: {
                    waiting: highPriorityWaiting.length,
                    active: highPriorityActive.length,
                },
                lowPriority: {
                    waiting: lowPriorityWaiting.length,
                    active: lowPriorityActive.length,
                },
            },
        };
    }

    private async collectRedisMetrics(): Promise<RedisMetrics> {
        try {
            // Use the Redis client from Bull queue instead of creating new connection
            const redis = this.stressTestQueue.client;

            const info = await redis.info();
            const lines = info.split('\r\n');

            const metrics: RedisMetrics = {
                memoryUsage: 0,
                connectedClients: 0,
                commandsPerSecond: 0,
                keyspaceHits: 0,
                keyspaceMisses: 0,
            };

            for (const line of lines) {
                if (line.includes('used_memory:')) {
                    metrics.memoryUsage = parseInt(line.split(':')[1]);
                } else if (line.includes('connected_clients:')) {
                    metrics.connectedClients = parseInt(line.split(':')[1]);
                } else if (line.includes('instantaneous_ops_per_sec:')) {
                    metrics.commandsPerSecond = parseInt(line.split(':')[1]);
                } else if (line.includes('keyspace_hits:')) {
                    metrics.keyspaceHits = parseInt(line.split(':')[1]);
                } else if (line.includes('keyspace_misses:')) {
                    metrics.keyspaceMisses = parseInt(line.split(':')[1]);
                }
            }

            return metrics;
        } catch (error) {
            this.logger.error(`Error collecting Redis metrics: ${error.message}`);
            return {
                memoryUsage: 0,
                connectedClients: 0,
                commandsPerSecond: 0,
                keyspaceHits: 0,
                keyspaceMisses: 0,
            };
        }
    }

    async getRedisInfo(): Promise<any> {
        try {
            const redis = this.stressTestQueue.client;
            const info = await redis.info();

            // Get Redis configuration
            const configResult = await redis.config('GET', '*');
            const config = {};

            // Parse config result into key-value pairs
            for (let i = 0; i < (configResult as string[]).length; i += 2) {
                config[configResult[i]] = configResult[i + 1];
            }

            // Get specific maxmemory policy
            const maxmemoryPolicy = await redis.config('GET', 'maxmemory-policy');

            return {
                info,
                config,
                maxmemory_policy: maxmemoryPolicy[1], // config returns [key, value]
            };
        } catch (error) {
            this.logger.error(`Error getting Redis info: ${error.message}`);
            throw error;
        }
    }

    async resetMetrics(): Promise<void> {
        this.metrics.clear();
        this.logger.log('Metrics reset');
    }

    async getFinalMetrics(testId: string): Promise<Partial<TestMetrics>> {
        const testMetrics = this.metrics.get(testId);
        if (!testMetrics) {
            return {};
        }

        try {
            // Calculate final statistics
            const queueMetrics = await this.collectQueueMetrics();
            const redisMetrics = await this.collectRedisMetrics();

            return {
                totalJobsCompleted: queueMetrics.completed,
                totalJobsFailed: queueMetrics.failed,
                redisMetrics,
                // Add more calculated metrics as needed
            };
        } catch (error) {
            this.logger.error(`Error getting final metrics for test ${testId}: ${error.message}`);
            return {};
        }
    }

    async getQueueStats(): Promise<any> {
        try {
            const queueMetrics = await this.collectQueueMetrics();
            return {
                summary: {
                    totalWaiting: queueMetrics.waiting,
                    totalActive: queueMetrics.active,
                    totalCompleted: queueMetrics.completed,
                    totalFailed: queueMetrics.failed,
                },
                byQueue: queueMetrics.queues,
            };
        } catch (error) {
            this.logger.error(`Error getting queue stats: ${error.message}`);
            throw error;
        }
    }

    async getRedisConnectionInfo(): Promise<any> {
        try {
            const redis = this.stressTestQueue.client;

            // Get connection info
            const clientInfo = await redis.client('LIST') as string;
            const connectionCount = clientInfo.split('\n').length - 1;

            return {
                connectionCount,
                redisVersion: await redis.info('server'),
                connected: redis.status === 'ready',
            };
        } catch (error) {
            this.logger.error(`Error getting Redis connection info: ${error.message}`);
            return {
                connectionCount: 0,
                connected: false,
                error: error.message,
            };
        }
    }

    private initializeTestMetrics(): TestMetrics {
        return {
            totalJobsSubmitted: 0,
            totalJobsCompleted: 0,
            totalJobsFailed: 0,
            averageProcessingTime: 0,
            peakThroughput: 0,
            averageThroughput: 0,
            queueDepthPeak: 0,
            memoryUsagePeak: 0,
            redisMetrics: {
                memoryUsage: 0,
                connectedClients: 0,
                commandsPerSecond: 0,
                keyspaceHits: 0,
                keyspaceMisses: 0,
            },
        };
    }
}
