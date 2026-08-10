export const COUNTRY_CODE_SETTING_NAME = 'COUNTRY_CODE_SETTINGS';
export const AUTO_APPLY_KOBO_COUNTRY_CODE =
  process.env.AUTO_APPLY_KOBO_COUNTRY_CODE === 'true';
// how long the resolved country code is cached in memory before being
// re-read from the database; falls back to 60s if unset or not a number.
export const COUNTRY_CODE_CACHE_TTL_MS =
  Number(process.env.COUNTRY_CODE_CACHE_TTL_MS) || 60_000;
