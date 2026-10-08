// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
export function sanitizeNonAlphaNumericValue(input: string): string {
  return input.replace(/[^\w\s]/gi, ''); // Remove all non-alphanumeric characters except whitespace
}

export const sanitizeData = (data: any) => {
  if (Array.isArray(data)) {
    return data.map((item) => {
      return sanitizeData(item);
    });
  } else if (typeof data === 'object' && data !== null) {
    const sanitizedObject: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        sanitizedObject[key] = trimNonAlphaNumericValue(data[key]);
      }
    }
    return sanitizedObject;
  } else if (typeof data === 'string') {
    return sanitizeNonAlphaNumericValue(data);
  } else {
    return data;
  }
}

export const sanitizeTrimValue = (input: string): string => {
  return input.trim();
}

// Utility function to remove all non-alphanumeric characters except spaces
export const trimNonAlphaNumericValue = (input: string): string => {
  return input ? input.replace(/[^\w\s]/g, '').trim() : ''; // Remove all non-alphanumeric characters except spaces and trim the string
}

const VALID_GENDERS = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'];

// Normalizes uploaded gender values to match the Gender enum (MALE | FEMALE | OTHER | UNKNOWN)
export const normalizeGender = (input?: string): string => {
  const normalized = input?.trim().toUpperCase();
  return VALID_GENDERS.includes(normalized) ? normalized : 'UNKNOWN';
}

const VALID_INTERNET_STATUSES = ['UNKNOWN', 'NO_INTERNET', 'HOME_INTERNET', 'MOBILE_INTERNET'];
const VALID_BANKED_STATUSES = ['UNKNOWN', 'UNBANKED', 'BANKED', 'UNDER_BANKED'];
const VALID_PHONE_STATUSES = ['UNKNOWN', 'NO_PHONE', 'FEATURE_PHONE', 'SMART_PHONE'];

const normalizeEnumValue = (input: string | undefined, validValues: readonly string[]): string => {
  const normalized = input?.trim().toUpperCase().replace(/\s+/g, '_') || '';
  return validValues.includes(normalized) ? normalized : 'UNKNOWN';
}

// Normalizes uploaded internet status values to match the InternetStatus enum
export const normalizeInternetStatus = (input?: string): string =>
  normalizeEnumValue(input, VALID_INTERNET_STATUSES);

// Normalizes uploaded banked status values to match the BankedStatus enum
export const normalizeBankedStatus = (input?: string): string =>
  normalizeEnumValue(input, VALID_BANKED_STATUSES);

// Normalizes uploaded phone status values to match the PhoneStatus enum
export const normalizePhoneStatus = (input?: string): string =>
  normalizeEnumValue(input, VALID_PHONE_STATUSES);

// Each entry lists every header alias a beneficiary-upload column may appear under;
// the first alias with a value wins. Keeping aliases together also drives extras capture.
const UPLOAD_COLUMN_ALIASES: Record<string, string[]> = {
  birthDate: ['Birth Date'],
  internetStatus: ['Internet Status', 'Internet Status*'],
  bankedStatus: ['Bank Status', 'Bank Status*'],
  location: ['Location'],
  phoneStatus: ['Phone Status', 'Phone Status*'],
  notes: ['Notes'],
  gender: ['Gender*', 'Gender'],
  latitude: ['Latitude'],
  longitude: ['Longitude'],
  age: ['Age', 'Age*'],
  walletAddress: ['Wallet Address'],
  name: ['Name*', 'Name'],
  phone: ['Whatsapp Number*', 'Phone Number*', 'Phone Number'],
  governmentId: ['Government ID'],
  uuid: ['UUID', 'uuid'],
};
const CLAIMED_UPLOAD_COLUMNS = Object.values(UPLOAD_COLUMN_ALIASES).flat();

const normalizeHeaderKey = (key: string): string => key.trim().replace(/\s+/g, ' ');

const trimRowKeys = (row: Record<string, unknown>): Record<string, unknown> =>
  Object.keys(row).reduce((acc, key) => {
    acc[normalizeHeaderKey(key)] = row[key];
    return acc;
  }, {} as Record<string, unknown>);

const pick = (row: Record<string, unknown>, field: keyof typeof UPLOAD_COLUMN_ALIASES) => {
  const alias = UPLOAD_COLUMN_ALIASES[field].find(
    (key) => row[key] !== undefined && row[key] !== ''
  );
  return alias ? row[alias] : undefined;
}

const toNumberOrUndefined = (value: unknown): number | undefined =>
  value !== undefined && value !== '' ? Number(value) : undefined;

const toSnakeCase = (key: string): string =>
  key
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export function getDateInfo(dateString: string) {
  try {
    const date = new Date(dateString);
    return {
      date: date.toISOString(),
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      age: new Date().getFullYear() - date.getFullYear(),
      isAdult: new Date().getFullYear() - date.getFullYear() > 18,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Maps a raw parsed beneficiary-upload row (sheet/JSON headers) into the shape
// expected by the beneficiary microservice, normalizing enums/numbers and
// collecting any unrecognized columns into `extras`.
export function mapUploadedBeneficiaryRow(rawRow: Record<string, unknown>) {
  const row = trimRowKeys(rawRow);

  const remainingColumns = Object.keys(row).reduce((acc, key) => {
    if (!CLAIMED_UPLOAD_COLUMNS.includes(key)) {
      acc[toSnakeCase(key)] = row[key];
    }
    return acc;
  }, {} as Record<string, unknown>);

  const birthDate = pick(row, 'birthDate');

  return {
    uuid: pick(row, 'uuid'),
    birthDate: birthDate ? new Date(birthDate as string).toISOString() : null,
    internetStatus: normalizeInternetStatus(pick(row, 'internetStatus') as string),
    bankedStatus: normalizeBankedStatus(pick(row, 'bankedStatus') as string),
    location: pick(row, 'location'),
    phoneStatus: normalizePhoneStatus(pick(row, 'phoneStatus') as string),
    notes: pick(row, 'notes'),
    gender: normalizeGender(pick(row, 'gender') as string),
    latitude: toNumberOrUndefined(pick(row, 'latitude')),
    longitude: toNumberOrUndefined(pick(row, 'longitude')),
    age: pick(row, 'age') || null,
    walletAddress: pick(row, 'walletAddress'),
    extras: remainingColumns,
    piiData: {
      name: pick(row, 'name') || 'Unknown',
      phone: pick(row, 'phone'),
      extras: {
        isAdult: getDateInfo(birthDate as string)?.isAdult || Number(pick(row, 'age')) > 18,
        governmentId: pick(row, 'governmentId'),
      },
    },
  };
}

export function mapUploadedBeneficiaryRows(rawRows: Record<string, unknown>[]) {
  return rawRows.map(mapUploadedBeneficiaryRow);
}
