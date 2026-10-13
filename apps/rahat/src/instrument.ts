// Must be imported before any other module (including in main.ts) so Sentry
// can instrument Node's core modules before the app uses them.
// Load .env first: envConfig and the Sentry setup below read process.env at
// import time, before ConfigModule loads the file. Real env vars still win.
import 'dotenv/config';
import * as Sentry from '@sentry/nestjs';
import {
  SENTRY_DSN,
  SENTRY_ENVIRONMENT,
  SENTRY_RELEASE,
  SENTRY_TRACES_SAMPLE_RATE,
} from './utils/envConfig';
import { scrubSentryEvent } from './utils/sentryScrub';

Sentry.init({
  dsn: SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  release: SENTRY_RELEASE,
  tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
  // Kobo imports carry phone numbers and names; mask them before sending.
  beforeSend: scrubSentryEvent,
});
