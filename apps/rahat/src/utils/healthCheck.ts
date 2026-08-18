import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { PrismaService } from '@rumsan/prisma';
import axios from 'axios';
import { Queue } from 'bull';

export async function checkDatabase(prisma: PrismaService): Promise<{
    status: 'up' | 'down';
    message?: string;
}> {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return { status: 'up' };
    } catch (err) {
        return { status: 'down', message: (err as Error).message };
    }
}

export async function checkRedis(queue: Queue): Promise<{
    status: 'up' | 'down';
    message?: string;
}> {
    try {
        const pong = await queue.client.ping();
        if (pong !== 'PONG') throw new Error(`Unexpected ping response:${pong}`);
        return { status: 'up' };
    } catch (err) {
        return { status: 'down', message: (err as Error).message };
    }
}

export async function checkRPCUrl(prisma: PrismaService): Promise<{
    status: 'up' | 'down';
    message?: string;
}> {
    try {
        const settings = await prisma.setting.findUnique({
            where: {
                name: 'CHAIN_SETTINGS',
            },
        });
        const settingsValue = settings?.value as any;
        const rpcUrl = settingsValue?.rpcUrl;
        if (settingsValue.name?.toLowerCase() == 'evm') {
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
            if (res.data && res.data.error)
                throw new Error(`Unexpected error during RPCCall`);
            return { status: 'up' };
        }
        return { status: 'up' };
    } catch (err) {
        return { status: 'down', message: (err as Error).message };
    }
}

export async function checkCloudflare(prisma: PrismaService): Promise<{
    status: 'up' | 'down';
    message?: string;
}> {
    let settingsValue;
    try {
        const settings = await prisma.setting.findUnique({
            where: {
                name: 'CLOUDFLARE_R2',
            },
        });
        settingsValue = settings?.value as any;
        const s3 = new S3Client({
            region: 'auto',
            endpoint: `https://${settingsValue.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: settingsValue.R2_ACCESS_KEY_ID,
                secretAccessKey: settingsValue.R2_SECRET_ACCESS_KEY,
            },
        });

        await s3.send(new HeadBucketCommand({ Bucket: settingsValue?.R2_BUCKET }));
        return { status: 'up' };
    } catch (error) {
        let errorMessage = 'Unknown R2 error';

        if (error.$metadata?.httpStatusCode === 403) {
            errorMessage = 'Access Denied: Invalid credentials or scope permissions';
        } else if (error.$metadata?.httpStatusCode === 404) {
            errorMessage = `Bucket '${settingsValue?.R2_BUCKET}' does not exist`;
        } else if (error.message) {
            errorMessage = error.message;
        }
        return { status: 'down', message: (error as Error).message };
    }
}

export interface HealthStatus {
    status: 'up' | 'degraded';
    services: {
        database: { status: 'up' | 'down'; message?: string };
        redis: { status: 'up' | 'down'; message?: string };
        rpcUrl: { status: 'up' | 'down'; message?: string };
        cloudflare: { status: 'up' | 'down'; message?: string };
    };
}
