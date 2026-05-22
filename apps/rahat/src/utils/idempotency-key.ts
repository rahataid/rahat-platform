import { createHash, randomUUID } from 'crypto';

/**
 * Recursively sorts object keys so that nested objects produce a stable JSON
 * string regardless of insertion order.
 */
function sortedJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortedJson);
  if (value !== null && typeof value === 'object') {
    return Object.keys(value as object)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortedJson((value as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return value;
}

/**
 * Per-request idempotency key: deterministic hash of (cmd, payload) plus a
 * random nonce so that two intentionally identical payloads (e.g. creating
 * two campaigns with the same name) get distinct keys.
 *
 * Multi-pod dedup still works: the nonce travels inside the payload that Redis
 * pub/sub broadcasts to every consumer, so all pods derive the same scoped key
 * for the same HTTP request.
 */
export function generateIdempotencyKey(cmd: unknown, payload: unknown): string {
  const normalizedCmd =
    typeof cmd === 'string' ? cmd : JSON.stringify(sortedJson(cmd) ?? {});

  const normalizedPayload = JSON.stringify(sortedJson(payload) ?? {});

  const nonce = randomUUID();

  return createHash('sha256')
    .update(`${normalizedCmd}::${normalizedPayload}::${nonce}`)
    .digest('hex');
}
