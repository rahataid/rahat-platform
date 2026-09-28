// Must be imported before any other module (including in main.ts) so Sentry
// can instrument Node's core modules before the app uses them.
import * as Sentry from '@sentry/nestjs';
import {
  AUTO_APPLY_KOBO_COUNTRY_CODE,
  SENTRY_ENVIRONMENT,
  SENTRY_TRACES_SAMPLE_RATE,
} from './utils/envConfig';

// AUTO_APPLY_KOBO_COUNTRY_CODE marks a production deployment (see
// utils/envConfig.ts); Sentry should only report from production, so it's
// left uninitialized in development — captureException/captureMessage calls
// become no-ops.
if (AUTO_APPLY_KOBO_COUNTRY_CODE) {
  // TEMP DEBUG — remove once dev-server SENTRY_DSN delivery is confirmed.
  console.log(process.env.SENTRY_DSN, 'sentry dsn value');

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
  });
}
