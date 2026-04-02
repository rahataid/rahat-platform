import { createHash } from 'crypto';

/**
 * Deterministic idempotency key from (cmd, payload) — same inputs always
 * produce the same SHA-256 hex digest. Used by CRM IdempotencyInterceptor.
 */
export function generateIdempotencyKey(cmd: unknown, payload: unknown): string {
  const normalizedCmd =
    typeof cmd === 'string' ? cmd : JSON.stringify(cmd ?? {});

  const sortedKeys = Object.keys(payload ?? {}).sort();
  const normalizedPayload = JSON.stringify(payload ?? {}, sortedKeys);

  return createHash('sha256')
    .update(`${normalizedCmd}::${normalizedPayload}`)
    .digest('hex');
}
