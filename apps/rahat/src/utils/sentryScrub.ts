import type { ErrorEvent } from '@sentry/nestjs';

// Keys whose values must never leave the server. Kobo imports carry phone
// numbers and names; auth headers and wallet keys can show up in request data.
// A bare `name` key is masked (request bodies use it for people), so contexts
// the SDK fills in itself are skipped below to keep os.name/runtime.name.
const SENSITIVE_KEY =
  /phone|mobile|^(first|last|full|user|display)?_?name$|email|address|password|passwd|secret|token|authorization|cookie|private.?key|mnemonic|otp/i;

// Contexts populated by the SDK, never by our code; they hold no personal data.
const SDK_CONTEXTS = new Set([
  'os',
  'runtime',
  'device',
  'app',
  'cloud_resource',
  'culture',
  'trace',
]);

const FILTERED = '[Filtered]';
const MAX_DEPTH = 8;

function scrub(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return FILTERED;
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        SENSITIVE_KEY.test(k) ? FILTERED : scrub(v, depth + 1),
      ])
    );
  }
  return value;
}

// Sentry beforeSend backstop: masks sensitive keys in everything we or the SDK
// attach to an event, so adding more context later can't leak personal data.
export function scrubSentryEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    event.request = scrub(event.request) as typeof event.request;
  }
  if (event.extra) event.extra = scrub(event.extra) as typeof event.extra;
  if (event.contexts) {
    event.contexts = Object.fromEntries(
      Object.entries(event.contexts).map(([k, v]) => [
        k,
        SDK_CONTEXTS.has(k) ? v : scrub(v),
      ])
    ) as typeof event.contexts;
  }
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((b) =>
      b.data ? { ...b, data: scrub(b.data) as typeof b.data } : b
    );
  }
  return event;
}
