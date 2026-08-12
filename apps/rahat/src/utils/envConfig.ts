export const COUNTRY_CODE_SETTING_NAME = 'COUNTRY_CODE_SETTINGS';

// Read once at process start, so flipping this env var needs a restart —
// unlike COUNTRY_CODE_SETTINGS, which is cached with a TTL and can be updated
// live through the settings table. It must be a real process env var: this is
// evaluated before ConfigModule loads the .env file.
export const AUTO_APPLY_KOBO_COUNTRY_CODE =
  process.env.AUTO_APPLY_KOBO_COUNTRY_CODE === 'true';
export const COUNTRY_CODE_CACHE_TTL_MS =
  Number(process.env.COUNTRY_CODE_CACHE_TTL_MS) || 60_000;
