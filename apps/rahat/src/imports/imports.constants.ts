export const CLOUDFLARE_R2_SETTING_NAME = 'CLOUDFLARE_R2';

export const R2_IMPORTS_PREFIX = 'imports/';

export const SIGNED_URL_EXPIRY_SECONDS = 3600;

export const MAX_GROUP_NAME_LENGTH = 64;

export const DEFAULT_PER_PAGE = 20;

export const SSE_POLL_INTERVAL_MS = 1500;

export const IMPORT_STATUS = {
  NEW: 'NEW',
  PROCESSING: 'PROCESSING',
  IMPORTED: 'IMPORTED',
  FAILED: 'FAILED',
} as const;

export const TERMINAL_IMPORT_PHASES = ['completed', 'failed'] as const;

export const ALLOWED_SORT_FIELDS: Record<string, string> = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  status: 'status',
  source: 'source',
};

export const VALID_GENDERS = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'] as const;

export const STANDARD_FIELD_MAP: Record<string, { table: 'beneficiary' | 'pii'; field: string }> = {
  uuid: { table: 'beneficiary', field: 'uuid' },
  beneficiaryuuid: { table: 'beneficiary', field: 'uuid' },
  beneficiary_uuid: { table: 'beneficiary', field: 'uuid' },
  name: { table: 'pii', field: 'name' },
  phone: { table: 'pii', field: 'phone' },
  email: { table: 'pii', field: 'email' },
  gender: { table: 'beneficiary', field: 'gender' },
  walletaddress: { table: 'beneficiary', field: 'walletAddress' },
  birthdate: { table: 'beneficiary', field: 'birthDate' },
  age: { table: 'beneficiary', field: 'age' },
  location: { table: 'beneficiary', field: 'location' },
  latitude: { table: 'beneficiary', field: 'latitude' },
  longitude: { table: 'beneficiary', field: 'longitude' },
  notes: { table: 'beneficiary', field: 'notes' },
  bankedstatus: { table: 'beneficiary', field: 'bankedStatus' },
  internetstatus: { table: 'beneficiary', field: 'internetStatus' },
  phonestatus: { table: 'beneficiary', field: 'phoneStatus' },
};
