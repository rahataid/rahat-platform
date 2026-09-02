import { Controller, Get, Headers } from "@nestjs/common";
import { AuthsService } from "@rumsan/user";
import { HealthService } from "./health.service";

@Controller('/health')
export class HealthController {
    constructor(
        private readonly healthService: HealthService,
        private readonly authsService: AuthsService,
    ) { }

    @Get('')
    async checkHealthStatus(@Headers('authorization') authHeader: string) {
        const result = await this.healthService.getHealthStatus();

        const isAuthenticated = this.isValidToken(authHeader);
        if (isAuthenticated) {
            return result;
        }

        // Strip sensitive notes/link for unauthenticated requests
        const services = Object.fromEntries(
            Object.entries(result.services).map(([key, svc]) => [
                key,
                {
                    status: svc.status,
                    latency: svc.latency,
                    last_checked: svc.last_checked,
                    ...(svc.message ? { message: svc.message } : {}),
                },
            ])
        );

        return { status: result.status, services };
    }

    private isValidToken(authHeader: string): boolean {
        try {
            if (!authHeader) return false;
            const [type, token] = authHeader.split(' ');
            if (type !== 'Bearer' || !token) return false;
            this.authsService.validateToken(token);
            return true;
        } catch {
            return false;
        }
    }
}
