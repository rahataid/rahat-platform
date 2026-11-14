// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { PhoneNumberFormat, PhoneNumberUtil } from 'google-libphonenumber';

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

export const trimNonAlphaNumericValue = (input: string): string => {
  return input.replace(/^\W+|\W+$/g, ''); // Remove all non-alphanumeric characters from the beginning and end of the string
}

export const sanitizePhone = (phone?: string, defaultRegion = 'NP'): string | null => {
  if (!phone) return null;
  if (typeof phone !== 'string') throw new Error('Beneficiary phone number must be text');
  const util = PhoneNumberUtil.getInstance();
  let number;
  try {
    number = util.parse(phone, defaultRegion);
  } catch {
    throw new Error('Invalid beneficiary phone number');
  }
  if (!util.isValidNumber(number)) throw new Error('Invalid beneficiary phone number');
  return util.format(number, PhoneNumberFormat.E164);
}