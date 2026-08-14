import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { BQUEUE } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { Queue } from 'bull';

interface HealthStatus {
    status: 'up' | 'degraded';
    services: {
        database: { status: 'up' | 'down'; message?: string };
        redis: { status: 'up' | 'down'; message?: string };
    };
}

@Injectable()
export class HealthService {
    private readonly CACHE_KEY = 'health_status';
    private readonly CACHE_TTL = 60;

    constructor(
        private readonly prisma: PrismaService,
        @InjectQueue(BQUEUE.RAHAT) private readonly rahatQueue: Queue
    ) { }


    async getHealthStatus(): Promise<HealthStatus> {
        let result;
        const cached = await this.getHealthStatusFromCache();
        if (cached) {
            return result = cached;
        }
        result = await this.checkHealthStatus();
        return result;


    }

    async checkHealthStatus(): Promise<HealthStatus> {
        // const cached = await this.getHealthStatusFromCache();
        // if (cached) {
        //     return cached;
        // }

        const [database, redis] = await Promise.all([
            this.checkDatabase(),
            this.checkRedis(),
        ]);

        const allUp = database.status === 'up' && redis.status === 'up';
        const result: HealthStatus = {
            status: allUp ? 'up' : 'degraded',
            services: {
                database,
                redis,
            },
        };

        // Store in Redis cache
        // await this.setCache(result);

        return result;
    }

    async getHealthStatusFromCache(): Promise<HealthStatus | null> {
        try {
            const cached = await this.rahatQueue.client.get(this.CACHE_KEY);
            if (!cached) {
                return null
            }

            return JSON.parse(cached) as HealthStatus;;
        } catch (err) {
            console.log(err)
            return null;
        }
    }

    private async setCache(data: HealthStatus): Promise<void> {
        try {
            await this.rahatQueue.client.setex(
                this.CACHE_KEY,
                this.CACHE_TTL,
                JSON.stringify(data)
            );
        } catch { }
    }

    private async checkDatabase(): Promise<{
        status: 'up' | 'down';
        message?: string;
    }> {
        try {
            await this.prisma.$queryRaw`SELECT 1`;
            return { status: 'up' };
        } catch (error) {
            return { status: 'down', message: (error as Error).message };
        }
    }

    private async checkRedis(): Promise<{
        status: 'up' | 'down';
        message?: string;
    }> {
        try {
            const pong = await this.rahatQueue.client.ping();
            if (pong !== 'PONG') throw new Error(`Unexpected ping response: ${pong}`);
            return { status: 'up' };
        } catch (error) {
            return { status: 'down', message: (error as Error).message };
        }
    }
}
