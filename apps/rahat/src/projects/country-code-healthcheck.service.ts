import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import {
  AUTO_APPLY_KOBO_COUNTRY_CODE,
  COUNTRY_CODE_HEALTHCHECK_INTERVAL_MS,
  COUNTRY_CODE_SETTING_NAME,
  SENTRY_DSN,
  SENTRY_ENVIRONMENT,
} from '../utils/envConfig';
import { ProjectService } from './project.service';

// Alerts when the country code setting is missing, instead of waiting for a
// Kobo import to hit it. Runs on every startup (i.e. right after each deploy),
// then on a timer so a row deleted while the app is running is caught too.
@Injectable()
export class CountryCodeHealthcheckService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(CountryCodeHealthcheckService.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly projectService: ProjectService) {}

  // Only runs where Sentry is on (DSN set), the environment is production and
  // the country code is actually applied to Kobo phones; otherwise a missing
  // setting is harmless and must not alert.
  onApplicationBootstrap() {
    if (
      !SENTRY_DSN ||
      SENTRY_ENVIRONMENT !== 'production' ||
      !AUTO_APPLY_KOBO_COUNTRY_CODE
    )
      return;
    void this.check();
    this.timer = setInterval(
      () => void this.check(),
      COUNTRY_CODE_HEALTHCHECK_INTERVAL_MS
    );
    // don't keep the process alive just for this timer
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // Reports to Sentry (never throws) when COUNTRY_CODE_SETTINGS is missing or
  // has no usable calling code. Skips the cache so it sees the live row.
  async check(): Promise<boolean> {
    try {
      const countryCode = await this.projectService.getKoboCountryCodeFromSettings(
        true
      );
      if (countryCode) return true;
      this.logger.error(
        `[kobo-import] ${COUNTRY_CODE_SETTING_NAME} is missing or has no valid calling code`
      );
      // Fixed message so repeat checks group into one Sentry issue.
      Sentry.captureException(
        new Error(
          'Country code is not set up in Settings: Kobo villager imports will fail until the tech team adds it.'
        ),
        {
          tags: {
            area: 'kobo-import',
            issue: 'country-code-missing-healthcheck',
          },
          extra: {
            technicalDetail: `Startup/periodic check found no usable calling code in "${COUNTRY_CODE_SETTING_NAME}".`,
          },
        }
      );
      return false;
    } catch (err) {
      this.logger.error(
        `[kobo-import] country code health check failed: ${
          (err as Error)?.message
        }`
      );
      return false;
    }
  }
}
