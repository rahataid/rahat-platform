import { PrismaService } from '@rumsan/prisma';
import { ClientProxy } from '@nestjs/microservices';
import axios from 'axios';
import { Queue } from 'bull';
import { firstValueFrom, timeout } from 'rxjs';

export interface ServiceStatus {
  status: 'up' | 'down';
  message?: string;
  latency?: string;
  last_checked?: string;
  notes?: string | Record<string, any>;
  link?: string;
}

export interface HealthStatus {
  status: 'up' | 'degraded';
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    rpcUrl: ServiceStatus;
    wom: ServiceStatus;
    smsVoucher: ServiceStatus;
  };
}

export const SERVICE_LABELS: Record<string, string> = {
  database: 'Database',
  redis: 'Redis',
  rpcUrl: 'RPC URL',
  wom: 'WOM Microservice',
  smsVoucher: 'SMS Voucher Microservice',
};

export async function checkProjectMicroservice(
  serviceName: 'wom' | 'smsVoucher',
  client: ClientProxy,
  projectId: string | undefined
): Promise<ServiceStatus> {
  const start = performance.now();
  const last_checked = new Date().toISOString();

  try {
    if (!projectId?.trim()) {
      throw new Error('PROJECT_ID is not configured');
    }

    const response = await firstValueFrom(
      client
        .send({ cmd: 'rahat.jobs.health.getcheck', uuid: projectId.trim() }, {})
        .pipe(timeout({ first: 5000 }))
    );

    if (
      !response ||
      typeof response !== 'object' ||
      !['up', 'degraded'].includes(response.status) ||
      !response.services ||
      typeof response.services !== 'object'
    ) {
      throw new Error(
        `${SERVICE_LABELS[serviceName]} returned an invalid health response`
      );
    }

    return {
      status: 'up',
      latency: `${(performance.now() - start).toFixed(2)}ms`,
      last_checked,
      notes: {
        reported_status: response.status,
      },
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

export async function checkDatabase(
  prisma: PrismaService
): Promise<ServiceStatus> {
  const start = performance.now();
  const last_checked = new Date().toISOString();
  try {
    const [connRows] = await Promise.all([
      prisma.$queryRaw<Array<{ active: bigint; max: bigint }>>`
                SELECT
                    (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database()) AS active,
                    (SELECT setting::bigint FROM pg_settings WHERE name = 'max_connections') AS max
            `,
    ]);
    const { active, max } = connRows[0];
    return {
      status: 'up',
      latency: `${(performance.now() - start).toFixed(2)}ms`,
      last_checked,
      link: process.env.DATABASE_URL,
      notes: {
        active_connections: Number(active),
        max_connections: Number(max),
        connections: Number(active),
      },
    };
  } catch (err) {
    return {
      status: 'down',
      message: (err as Error).message,
      latency: `${(performance.now() - start).toFixed(2)}ms`,
      last_checked,
      link: process.env.DATABASE_URL,
      notes: {},
    };
  }
}

export async function checkRedis(queue: Queue): Promise<ServiceStatus> {
  const start = performance.now();
  const last_checked = new Date().toISOString();
  try {
    const [pong, infoRaw] = await Promise.all([
      queue.client.ping(),
      queue.client.info('all'),
    ]);
    if (pong !== 'PONG') throw new Error(`Unexpected ping response: ${pong}`);

    // Parse INFO sections into a flat key-value map
    const infoMap: Record<string, string> = {};
    for (const line of infoRaw.split('\r\n')) {
      if (!line || line.startsWith('#')) continue;
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      infoMap[line.slice(0, colonIdx).trim()] = line.slice(colonIdx + 1).trim();
    }

    const connections = parseInt(infoMap['connected_clients'] ?? '0', 10);
    const memory: Record<string, string> = {
      used_memory_human: infoMap['used_memory_human'] ?? '',
      used_memory_peak_human: infoMap['used_memory_peak_human'] ?? '',
      used_memory_rss_human: infoMap['used_memory_rss_human'] ?? '',
      maxmemory_human: infoMap['maxmemory_human'] ?? '',
      mem_fragmentation_ratio: infoMap['mem_fragmentation_ratio'] ?? '',
    };

    return {
      status: 'up',
      latency: `${(performance.now() - start).toFixed(2)}ms`,
      last_checked,
      link: process.env.REDIS_URL,
      notes: {
        connections,
        memory,
        redis_version: infoMap['redis_version'] ?? '',
        uptime_in_days: infoMap['uptime_in_days'] ?? '',
        role: infoMap['role'] ?? '',
      },
    };
  } catch (err) {
    return {
      status: 'down',
      message: (err as Error).message,
      latency: `${(performance.now() - start).toFixed(2)}ms`,
      last_checked,
      link: process.env.REDIS_URL,
      notes: {},
    };
  }
}

export async function checkRPCUrl(
  prisma: PrismaService
): Promise<ServiceStatus> {
  const start = performance.now();
  let rpcUrl;
  let res;
  const last_checked = new Date().toISOString();
  try {
    const settings = await prisma.setting.findUnique({
      where: { name: 'CHAIN_SETTINGS' },
    });

    if (!settings) {
      throw new Error('CHAIN_SETTINGS not found in the database');
    }

    const settingsValue = settings?.value as any;
    rpcUrl = settingsValue?.rpcUrl;

    // if (settingsValue?.name?.toLowerCase() === 'evm') {
    res = await axios.post(
      rpcUrl,
      { jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 5000 }
    );
    if (res.data?.error) throw new Error(`Unexpected error during RPCCall`);
    // }

    return {
      status: 'up',
      latency: `${(performance.now() - start).toFixed(2)}ms`,
      last_checked,
      notes: {
        method: 'eth_blockNumber',
      },
      link: rpcUrl,
    };
  } catch (err) {
    return {
      status: 'down',
      message: (err as Error).message,
      latency: `${(performance.now() - start).toFixed(2)}ms`,
      last_checked,
      link: rpcUrl,
    };
  }
}

export async function updateHealthStatus(
  prisma: PrismaService,
  rahatQueue: Queue,
  elClient: ClientProxy
): Promise<HealthStatus> {
  const [database, redis, rpcUrl, wom, smsVoucher] = await Promise.all([
    checkDatabase(prisma),
    checkRedis(rahatQueue),
    checkRPCUrl(prisma),
    checkProjectMicroservice('wom', elClient, process.env.WOM_PROJECT_ID),
    checkProjectMicroservice(
      'smsVoucher',
      elClient,
      process.env.SMS_VOUCHER_PROJECT_ID
    ),
  ]);

  console.log('Health check results:', { database, redis, rpcUrl, wom , smsVoucher });
  const allUp =
    database.status === 'up' &&
    redis.status === 'up' &&
    rpcUrl.status === 'up' &&
    wom.status === 'up' &&
    smsVoucher.status === 'up';
  const result: HealthStatus = {
    status: allUp ? 'up' : 'degraded',
    services: {
      database,
      redis,
      rpcUrl,
      wom,
      smsVoucher,
    },
  };
  return result;
}
