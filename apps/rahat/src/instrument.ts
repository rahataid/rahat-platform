// Must be imported before any other module (including in main.ts) so Sentry
// can instrument Node's core modules before the app uses them.
import * as Sentry from '@sentry/nestjs';

const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT;
const SENTRY_TRACES_SAMPLE_RATE = Number(
  process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.2
);

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: SENTRY_ENVIRONMENT,
  tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
});
