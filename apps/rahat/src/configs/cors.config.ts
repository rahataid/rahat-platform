// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.

import { Logger } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

export class CorsConfigService {
  private readonly logger = new Logger(CorsConfigService.name);

  constructor(private readonly configService: ConfigService) {}

  createCorsOptions(): CorsOptions {
    const allowedOrigins = this.configService.get<string>('ALLOWED_ORIGINS');
    const defaultStringOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
    ];
    const rahatDomainRegex = /^https?:\/\/(.+\.)?rahat\.io$/;

    this.logger.log(
      `CORS config service initialized with allowed origins: ${
        allowedOrigins || 'none (using defaults)'
      }`
    );

    let corsOrigins: (string | RegExp)[];

    if (allowedOrigins) {
      corsOrigins = allowedOrigins
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);

      this.logger.log(
        `CORS configured with allowed origins: ${corsOrigins.join(', ')}`
      );
    } else {
      const nodeEnv = this.configService.get<string>('NODE_ENV');
      corsOrigins =
        nodeEnv === 'production'
          ? [rahatDomainRegex] // Only allow rahat.io domains in production
          : [...defaultStringOrigins, rahatDomainRegex]; // Allow localhost + rahat.io in development

      const originsDescription =
        nodeEnv === 'production'
          ? 'rahat.io domains only'
          : `${defaultStringOrigins.join(', ')} + rahat.io domains`;

      this.logger.warn(
        nodeEnv === 'production'
          ? 'ALLOWED_ORIGINS not set in production - allowing rahat.io domains only'
          : `ALLOWED_ORIGINS not set - using default development origins: ${originsDescription}`
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
        'Pragma',
      ],
      credentials: true,
      optionsSuccessStatus: 200, // Some legacy browsers choke on 204
      maxAge: 86400, // Cache preflight response for 24 hours
    };
  }
}
