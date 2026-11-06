// Must be imported before any other module (including in main.ts) so Sentry
// can instrument Node's core modules before the app uses them.
// Load .env first: envConfig and the Sentry setup below read process.env at
// import time, before ConfigModule loads the file. Real env vars still win.
import 'dotenv/config';
import * as Sentry from '@sentry/nestjs';
import {
  SENTRY_DSN,
  SENTRY_ENVIRONMENT,
  SENTRY_TRACES_SAMPLE_RATE,
} from './utils/envConfig';

// Sentry should only report from production, so it's left uninitialized in development — captureException/captureMessage calls
// become no-ops. A missing DSN also leaves Sentry disabled.
if (process.env.NODE_ENV === 'production' && SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: SENTRY_ENVIRONMENT,
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
  });
}
