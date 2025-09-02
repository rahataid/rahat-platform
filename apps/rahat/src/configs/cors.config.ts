// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { Logger } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

export class CorsConfigService {
    private readonly logger = new Logger(CorsConfigService.name);

    constructor(private readonly configService: ConfigService) { }

    createCorsOptions(): CorsOptions {
        const allowedOrigins = this.configService.get<string>('ALLOWED_ORIGINS');
        const defaultOrigins = ['http://localhost:3000', 'http://localhost:3001'];

        let corsOrigins: string[];

        if (allowedOrigins) {
            corsOrigins = allowedOrigins
                .split(',')
                .map(origin => origin.trim())
                .filter(origin => origin.length > 0);

            this.logger.log(`CORS configured with allowed origins: ${corsOrigins.join(', ')}`);
        } else {
            corsOrigins = process.env.NODE_ENV === 'production' ? [] : defaultOrigins;

            this.logger.warn(
                process.env.NODE_ENV === 'production'
                    ? 'ALLOWED_ORIGINS not set in production - CORS will block all origins'
                    : `ALLOWED_ORIGINS not set - using default development origins: ${defaultOrigins.join(', ')}`
            );
        }

        return {
            origin: corsOrigins.length > 0 ? corsOrigins : false,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'Accept',
                'Origin',
                'X-Requested-With',
                'Cache-Control',
                'Pragma'
            ],
            credentials: true,
            optionsSuccessStatus: 200, // Some legacy browsers choke on 204
            maxAge: 86400, // Cache preflight response for 24 hours
        };
    }
}
