import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { BQUEUE } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { Queue } from 'bull';
import {
    HealthStatus,
    updateHealthStatus
} from '../utils/healthCheck';

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
        const result = await updateHealthStatus(this.prisma, this.rahatQueue)
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
}
