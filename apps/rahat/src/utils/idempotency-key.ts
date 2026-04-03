import { createHash } from 'crypto';

/**
 * Deterministic idempotency key from (cmd, payload) — same inputs always
 * produce the same SHA-256 hex digest. Used by CRM IdempotencyInterceptor.
 */
export function generateIdempotencyKey(cmd: unknown, payload: unknown): string {
  const normalizedCmd = stringifyCanonical(cmd, 'unknown_cmd');
  const normalizedPayload = stringifyCanonical(payload, 'unknown_payload');

  return createHash('sha256')
    .update(`${normalizedCmd}::${normalizedPayload}`)
    .digest('hex');
}

function stringifyCanonical(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  if (value === undefined || value === null) {
    return fallback;
  }

  try {
    return JSON.stringify(sortObjectDeep(value));
  } catch {
    return String(value);
  }
}

function sortObjectDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortObjectDeep(item));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      (acc as Record<string, unknown>)[key] = sortObjectDeep(
        (value as Record<string, unknown>)[key]
      );
      return acc;
    }, {} as Record<string, unknown>);
}
