import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaService } from '@rumsan/prisma';
import axios from 'axios';
import { Queue } from 'bull';

export interface ServiceStatus {
    status: 'up' | 'down';
    message?: string;
    latency?: string;
    last_checked?: string;
    notes?: string;
    link?: string;
}

export interface HealthStatus {
    status: 'up' | 'degraded';
    services: {
        database: ServiceStatus;
        redis: ServiceStatus;
        rpcUrl: ServiceStatus;
        cloudflare: ServiceStatus;
        communication: ServiceStatus
    };
}

export async function checkDatabase(prisma: PrismaService): Promise<ServiceStatus> {
    const start = performance.now();
    const last_checked = new Date().toISOString();
    try {
        await prisma.$queryRaw`SELECT 1`;
        return {
            status: 'up',
            latency: `${(performance.now() - start).toFixed(2)}ms`,
            last_checked,
        };
    } catch (err) {
        return {
            status: 'down',
            message: (err as Error).message,
            latency: `${(performance.now() - start).toFixed(2)}ms`,
            last_checked,
        };
    }
}

export async function checkRedis(queue: Queue): Promise<ServiceStatus> {
    const start = performance.now();
    const last_checked = new Date().toISOString();
    try {
        const pong = await queue.client.ping();
        if (pong !== 'PONG') throw new Error(`Unexpected ping response: ${pong}`);
        return {
            status: 'up',
            latency: `${(performance.now() - start).toFixed(2)}ms`,
            last_checked,
        };
    } catch (err) {
        return {
            status: 'down',
            message: (err as Error).message,
            latency: `${(performance.now() - start).toFixed(2)}ms`,
            last_checked,
        };
    }
}

export async function checkRPCUrl(prisma: PrismaService): Promise<ServiceStatus> {
    const start = performance.now();
    let rpcUrl;
    let res;
    const last_checked = new Date().toISOString();
    try {
        const settings = await prisma.setting.findUnique({
            where: { name: 'CHAIN_SETTINGS' },
        });
        const settingsValue = settings?.value as any;
        rpcUrl = settingsValue?.rpcUrl;

        if (settingsValue?.name?.toLowerCase() === 'evm') {
            res = await axios.post(
                rpcUrl,
                { jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 },
                { headers: { 'Content-Type': 'application/json' }, timeout: 5000 }
            );
            if (res.data?.error) throw new Error(`Unexpected error during RPCCall`);
        }

        return {
            status: 'up',
            latency: `${(performance.now() - start).toFixed(2)}ms`,
            last_checked,
            notes: res?.data,
            link: rpcUrl
        };
    } catch (err) {
        return {
            status: 'down',
            message: (err as Error).message,
            latency: `${(performance.now() - start).toFixed(2)}ms`,
            last_checked,
            link: rpcUrl

        };
    }
}

export async function checkCloudflare(prisma: PrismaService): Promise<ServiceStatus> {
    const start = performance.now();
    const last_checked = new Date().toISOString();
    let endpoint: any;
    let settingsValue: any;
    try {
        const settings = await prisma.setting.findUnique({
            where: { name: 'CLOUDFLARE_R2' },
        });
        settingsValue = settings?.value as any;
        endpoint = `https://${settingsValue.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

        const s3 = new S3Client({
            region: 'auto',
            endpoint: `https://${settingsValue.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: settingsValue.R2_ACCESS_KEY_ID,
                secretAccessKey: settingsValue.R2_SECRET_ACCESS_KEY,
            },
        });

        await s3.send(new HeadBucketCommand({ Bucket: settingsValue?.R2_BUCKET }));
        return {
            status: 'up',
            latency: `${(performance.now() - start).toFixed(2)}ms`,
            last_checked,
            notes: `Bucket: ${settingsValue?.R2_BUCKET}`,
            link: endpoint
        };
    } catch (error: any) {
        let message = 'Unknown R2 error';
        if (error.$metadata?.httpStatusCode === 403) {
            message = 'Access Denied: Invalid credentials or scope permissions';
        } else if (error.$metadata?.httpStatusCode === 404) {
            message = `Bucket '${settingsValue?.R2_BUCKET}' does not exist`;
        } else if (error.message) {
            message = error.message;
        }
        return {
            status: 'down',
            message,
            latency: `${(performance.now() - start).toFixed(2)}ms`,
            last_checked,
            link: endpoint
        };
    }
}

export async function checkCommunication(prisma: PrismaService): Promise<ServiceStatus> {
    const start = performance.now();
    const last_checked = new Date().toISOString();
    let endpoint: any;
    let settingsValue: any;
    try {
        const settings = await prisma.setting.findUnique({
            where: { name: 'COMMUNICATION' },
        });
        settingsValue = settings?.value as any;
        endpoint = settingsValue?.URL

        const res = await axios.get(endpoint);
        return {
            status: 'up',
            latency: `${(performance.now() - start).toFixed(2)}ms`,
            last_checked,
            notes: res.data,
            link: endpoint
        };
    } catch (error: any) {

        return {
            status: 'down',
            message: error,
            latency: `${(performance.now() - start).toFixed(2)}ms`,
            last_checked,
            link: endpoint
        };
    }
}
