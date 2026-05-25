import { KOBO_FIELD_MAPPINGS } from './fieldMappings';

const NESTED_PAYLOAD_KEYS = [
  'data',
  'submission',
  'record',
  'body',
  'payload',
  'formdata',
] as const;

const FORM_FIELD_HINT =
  /^(?:_id|_uuid|Village|Villager|vd|phone|name|Eye|Health|kobo|group_)/i;

/** Kobo REST / webhook payloads may nest the submission under several keys. */
export function unwrapKoboPayload(data: unknown): Record<string, unknown> {
  if (!data) return {};
  if (typeof data === 'string') {
    try {
      return unwrapKoboPayload(JSON.parse(data));
    } catch {
      return {};
    }
  }
  if (typeof data !== 'object') return {};

  const root = data as Record<string, unknown>;
  if (hasFormFieldKeys(root)) return root;

  for (const key of NESTED_PAYLOAD_KEYS) {
    const nested = root[key];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
  }

  if (Array.isArray(root.results) && root.results[0]) {
    return unwrapKoboPayload(root.results[0]);
  }

  return root;
}

function hasFormFieldKeys(obj: Record<string, unknown>) {
  return Object.keys(obj).some(
    (key) => FORM_FIELD_HINT.test(key) || key.includes('/')
  );
}

export function normalizeKoboFieldValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return normalizeKoboFieldValue(value[0]);
    }
    const record = value as Record<string, unknown>;
    return normalizeKoboFieldValue(
      record.value ?? record.name ?? record.label ?? record.text
    );
  }
  return String(value).trim();
}

function setMappedField(
  target: Record<string, unknown>,
  field: string,
  value: unknown
) {
  const normalized = normalizeKoboFieldValue(value);
  if (!normalized) return;
  const existing = normalizeKoboFieldValue(target[field]);
  if (!existing) target[field] = normalized;
}

export function mapKoboFields(payload: Record<string, unknown>) {
  const mappedPayload: Record<string, unknown> = {};
  const meta: Record<string, unknown> = {};

  for (const key in payload) {
    const bareKey = key.includes('/') ? key.split('/').pop()! : key;
    const mapping =
      KOBO_FIELD_MAPPINGS[bareKey as keyof typeof KOBO_FIELD_MAPPINGS] ??
      KOBO_FIELD_MAPPINGS[key as keyof typeof KOBO_FIELD_MAPPINGS];

    if (mapping) {
      setMappedField(mappedPayload, mapping, payload[key]);
    } else {
      const normalized = normalizeKoboFieldValue(payload[key]);
      if (normalized) meta[bareKey] = normalized;
      if (bareKey !== key && normalized) meta[key] = normalized;
    }
  }

  return { ...mappedPayload, meta };
}

const VD_META_KEY =
  /^(?:village_?doctor|vd|kobo_?username|community_?health_?worker)$/i;
const VD_META_EXCLUDE = /(?:name|uuid|partner|eye|collector|submitted)/i;

/** Resolve Village Doctor identifier from mapped Kobo beneficiary + meta fallbacks. */
export function pickVillageDoctorIdentifier(benef: {
  koboUsername?: unknown;
  villageDoctorUuid?: unknown;
  meta?: Record<string, unknown>;
}) {
  const meta = benef.meta ?? {};
  const directCandidates = [
    benef.koboUsername,
    meta.Village_Doctor,
    meta.vd,
    meta.village_doctor,
    meta['Village Doctor'],
    meta.kobo_username,
    meta.koboUsername,
    benef.villageDoctorUuid,
    meta.village_doctor_uuid,
    meta.vd_uuid,
    meta.chwUuid,
  ];

  for (const raw of directCandidates) {
    const value = normalizeKoboFieldValue(raw);
    if (value) return value;
  }

  for (const [key, raw] of Object.entries(meta)) {
    const bareKey = key.includes('/') ? key.split('/').pop()! : key;
    if (VD_META_EXCLUDE.test(bareKey)) continue;
    if (!VD_META_KEY.test(bareKey)) continue;
    const value = normalizeKoboFieldValue(raw);
    if (value) return value;
  }

  return undefined;
}
