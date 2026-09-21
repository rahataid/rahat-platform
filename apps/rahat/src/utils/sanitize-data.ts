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
