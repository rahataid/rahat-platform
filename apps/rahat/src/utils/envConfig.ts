export const COUNTRY_CODE_SETTING_NAME = 'COUNTRY_CODE_SETTINGS';

export const AUTO_APPLY_KOBO_COUNTRY_CODE =
  process.env.AUTO_APPLY_KOBO_COUNTRY_CODE === 'true';
export const COUNTRY_CODE_CACHE_TTL_MS =
  Number(process.env.COUNTRY_CODE_CACHE_TTL_MS) || 60_000;

// How often the app re-checks that COUNTRY_CODE_SETTINGS still exists after
// startup, so a row deleted while the app is running is also alerted on.
export const COUNTRY_CODE_HEALTHCHECK_INTERVAL_MS =
  Number(process.env.COUNTRY_CODE_HEALTHCHECK_INTERVAL_MS) || 3_600_000;

// Villager creation slower than this is reported to Sentry as a
// [kobo-import] slow-import warning instead of failing silently.
export const KOBO_IMPORT_SLOW_THRESHOLD_MS =
  Number(process.env.KOBO_IMPORT_SLOW_THRESHOLD_MS) || 15_000;

// tells Sentry where to send events
export const SENTRY_DSN = process.env.SENTRY_DSN;

// labels Sentry events with the environment they came from, such as development, staging, or production
export const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT;

// names the deployed version (the git commit SHA, baked into the Docker image
// at build time) so Sentry can tag every error with the release it came from
export const SENTRY_RELEASE = process.env.SENTRY_RELEASE || undefined;

// tells Sentry how often to record performance data
export const SENTRY_TRACES_SAMPLE_RATE = Number(
  process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.2
);
