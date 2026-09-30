import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { BQUEUE } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import { Queue } from 'bull';
import { EmailService } from '../listeners/email.service';
import {
    HealthStatus,
    SERVICE_LABELS,
    ServiceStatus,
    updateHealthStatus,
} from '../utils/healthCheck';

const ALERT_STATE_KEY = 'core_health_alert_state';

@Injectable()
export class HealthService {
    private readonly CACHE_KEY = 'health_status';
    private readonly CACHE_TTL = 60;
    private readonly _logger = new Logger(HealthService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly emailService: EmailService,

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
        const result = await updateHealthStatus(this.prisma, this.rahatQueue);
        await this.setCache(result);
        await this.handleAlertTransitions(result);
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

    async sendHealthAlertEmail(
        downServices: Array<{ name: string; message?: string }>,
        frontendUrl?: string
    ): Promise<void> {
        try {
            this._logger.log('Health status alert email sending..');
            const recipients = (process.env.HEALTH_ALERT_EMAILS ?? '')
                .split(',')
                .map((e) => e.trim())
                .filter(Boolean);

            if (!recipients.length) {
                this._logger.warn('HEALTH_ALERT_EMAILS not configured, skipping alert');
                return;
            }

            await this.emailService.sendEmail(
                recipients,
                `[ALERT] ${downServices.length} service(s) down – Rahat Health Check`,
                `The following service(s) are currently unavailable: ${downServices
                    .map((s) => s.name)
                    .join(', ')}`,
                this.buildHealthEmailHtml('down', downServices, frontendUrl)
            );

            this._logger.log(`Health down-alert sent to: ${recipients.join(', ')}`);
        } catch (err) {
            this._logger.error(err);
        }
    }

    async sendHealthRestoredEmail(
        restoredServices: Array<{ name: string; restored: boolean }>,
        frontendURL?: string
    ): Promise<void> {
        try {
            const recipients = (process.env.HEALTH_ALERT_EMAILS ?? '')
                .split(',')
                .map((e) => e.trim())
                .filter(Boolean);

            if (!recipients.length) return;

            await this.emailService.sendEmail(
                recipients,
                `[NOTICE] All services restored – Rahat Health Check`,
                `The following service(s) have been restored: ${restoredServices.join(
                    ', '
                )}`,
                this.buildHealthEmailHtml(
                    'up',
                    restoredServices.map(({ name }) => ({ name })),
                    frontendURL
                )
            );

            this._logger.log(
                `Health restored-notice sent to: ${recipients.join(', ')}`
            );
        } catch (err) {
            this._logger.error(err);
        }
    }

    private async handleAlertTransitions(result: HealthStatus): Promise<void> {
        try {
            const downNow = this.getDownServices(result);
            const stored =
                (await this.rahatQueue.client.get(ALERT_STATE_KEY)) ?? '[]';
            const downBefore: string[] = JSON.parse(stored) ?? [];

            const newlyDown = downNow.filter((s) => !downBefore.includes(s));
            const restored = downBefore.filter((s) => !downNow.includes(s));

            const frontendSettings = await this.prisma.setting.findUnique({
                where: {
                    name: 'FRONTEND_URL',
                },
            });
            const frontendUrl = frontendSettings?.value ?? ('' as string);

            // No emails on first run/baseline — just record current state.
            if (downBefore.length || newlyDown.length) {
                if (newlyDown.length) {
                    await this.sendHealthAlertEmail(
                        newlyDown.map((name) => {
                            const svc = (result.services as Record<string, ServiceStatus>)[
                                name
                            ];
                            return {
                                name: SERVICE_LABELS[name] ?? name,
                                message: svc?.message,
                            };
                        }),
                        frontendUrl as string
                    );
                }
                if (restored.length) {
                    this._logger.log('health status up ');
                    const upServices = Object.entries(result.services)
                        .filter(([, status]) => status.status === 'up')
                        .map(([name]) => ({
                            name: SERVICE_LABELS[name] ?? name,
                            restored: restored.includes(name),
                        }));
                    await this.sendHealthRestoredEmail(
                        upServices,
                        frontendUrl as string
                    );
                }
            }

            await this.rahatQueue.client.setex(
                ALERT_STATE_KEY,
                24 * 60 * 60, // 24h safety TTL; overwritten every run while alive
                JSON.stringify(downNow)
            );
        } catch (err) {
            this._logger.error(`Failed to send health alert email: ${err}`);
        }
    }

    private getDownServices(result: HealthStatus): string[] {
        return Object.entries(result.services)
            .filter(([, status]) => status.status === 'down')
            .map(([name]) => name);
    }

    private async setCache(data: HealthStatus): Promise<void> {
        this._logger.log('Caching the health status');
        await this.rahatQueue.client.setex(
            this.CACHE_KEY,
            this.CACHE_TTL,
            JSON.stringify(data)
        );
    }

    private buildHealthEmailHtml(
        type: 'down' | 'up',
        services: Array<{ name: string; message?: string }>,
        frontendURL?: string
    ): string {
        const isDown = type === 'down';
        const accent = isDown ? '#d9534f' : '#5cb85c';
        const statusLabel = isDown ? 'DOWN' : 'UP';
        const heading = isDown
            ? '⚠ Service Health Alert'
            : '✓ Service Health Restored';
        const intro = isDown
            ? 'The following service(s) are currently unavailable:'
            : 'The following service(s) have been restored:';

        const rows = services
            .map(
                ({ name, message }) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eee">${name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eee;color:${accent};font-weight:500">${statusLabel}</td>
          ${isDown
                        ? `<td style="padding:8px 12px;border-bottom:1px solid #eee;color:#666;font-size:.9em">${message ?? 'No details'
                        }</td>`
                        : ''
                    }
        </tr>`
            )
            .join('');

        const extraHeader = isDown
            ? `<th style="text-align:left;padding:10px 12px;font-size:.85em">Message</th>`
            : '';

        return `<!DOCTYPE html>
  <html>
    <head><meta charset="utf-8"><style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;padding:20px}
      .wrap{max-width:700px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}
      .hdr{background:${accent};color:#fff;padding:20px 24px;text-align:center}
      .hdr h2{margin:0;font-size:1.2em}
      .body{padding:24px}
      table{width:100%;border-collapse:collapse}
      th{background:#f8f8f8;color:#333;text-align:left;padding:10px 12px;font-size:.85em}
      .foot{background:#f8f8f8;padding:16px 24px;text-align:center;color:#999;font-size:.85em}
    </style></head>
    <body>
      <div class="wrap">
      <div class="hdr"><h2>${heading}</h2></div>
      <div class="body">
      <p>${intro}</p>
      <table>
        <thead><tr>
          <th style="width:30%">Service</th>
          <th style="width:20%">Status</th>
          ${extraHeader}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      </div>
      <div class="foot">
      <p>Automated alert from Rahat Core Health Check · ${new Date().toLocaleString()} for  <a href= "${frontendURL}"> Dashboard</a></p>
      </div>
      </div>
    </body>
  </html>`;
    }
}
