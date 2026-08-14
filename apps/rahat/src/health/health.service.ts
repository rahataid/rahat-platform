import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { BQUEUE } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import axios from 'axios';
import { Queue } from 'bull';

interface HealthStatus {
    status: 'up' | 'degraded';
    services: {
        database: { status: 'up' | 'down'; message?: string };
        redis: { status: 'up' | 'down'; message?: string };
        rpcUrl: { status: 'up' | 'down'; message?: string };
    };
}

@Injectable()
export class HealthService {
    private readonly CACHE_KEY = 'health_status';
    private readonly CACHE_TTL = 60;

    constructor(
        private readonly prisma: PrismaService,
        private readonly _logger: Logger,
        @InjectQueue(BQUEUE.RAHAT) private readonly rahatQueue: Queue
    ) { }

    async getHealthStatus(): Promise<HealthStatus> {
        this._logger.log('Get the health status');
        let result;
        const cached = await this.getHealthStatusFromCache();
        if (cached) {
            return (result = cached);
        }
        result = await this.checkHealthStatus();
        return result;
    }

    async checkHealthStatus(): Promise<HealthStatus> {
        this._logger.log('Check the health status of all  used services');
        const [database, redis, rpcUrl] = await Promise.all([
            this.checkDatabase(),
            this.checkRedis(),
            this.checkRPCUrl()
        ]);

        const allUp = database.status === 'up' && redis.status === 'up';
        const result: HealthStatus = {
            status: allUp ? 'up' : 'degraded',
            services: {
                database,
                redis,
                rpcUrl
            },
        };
        await this.setCache(result);
        return result;
    }

    async getHealthStatusFromCache(): Promise<HealthStatus | null> {
        try {
            this._logger.log('Get the service health status from cache');
            const cached = await this.rahatQueue.client.get(this.CACHE_KEY);
            if (!cached) {
                return null;
            }

            return JSON.parse(cached) as HealthStatus;
        } catch (err) {
            this._logger.error(err);
            return null;
        }
    }

    private async setCache(data: HealthStatus): Promise<void> {
        this._logger.log('Caching the health status');
        await this.rahatQueue.client.setex(
            this.CACHE_KEY,
            this.CACHE_TTL,
            JSON.stringify(data)
        );
    }

    private async checkDatabase(): Promise<{
        status: 'up' | 'down';
        message?: string;
    }> {
        this._logger.log('Checking the database status');
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
        this._logger.log('Checking the redis status');
        try {
            const pong = await this.rahatQueue.client.ping();
            if (pong !== 'PONG') throw new Error(`Unexpected ping response: ${pong}`);
            return { status: 'up' };
        } catch (error) {
            return { status: 'down', message: (error as Error).message };
        }
    }

    private async checkRPCUrl(): Promise<{
        status: 'up' | 'down';
        message?: string;
    }> {
        this._logger.log('Checking the rpcurl status');
        try {
            const settings = await this.prisma.setting.findUnique({
                where: {
                    name: 'CHAIN_SETTINGS'
                }
            });
            const settingsValue = settings?.value as any;
            const rpcUrl = settingsValue?.rpcUrl;

            const res = await axios.post(
                rpcUrl,
                {
                    jsonrpc: '2.0',
                    method: 'eth_blockNumber',
                    params: [],
                    id: 1,
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 5000, // 5 second timeout
                }
            );
            if (res.data && res.data.error) throw new Error(`Unexpected error during RPCCall`);
            return { status: 'up' };
        } catch (error) {
            return { status: 'down', message: (error as Error).message };
        }
    }


}
