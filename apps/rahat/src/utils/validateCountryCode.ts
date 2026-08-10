import { parsePhoneNumberFromString } from 'libphonenumber-js';

// true when the number already carries the configured country code (e.g. an
// "86" number while COUNTRY_CODE_SETTINGS is "+86"), so no need to ad.
export function hasCallingCode(phone: string, callingCode: string): boolean {
  const digits = String(phone || '').replace(/\D/g, '');
  const code = String(callingCode || '').replace(/\D/g, '');
  if (!digits || !code) return false;

  const parsed = parsePhoneNumberFromString(`+${digits}`);
  return parsed ? parsed.countryCallingCode === code : digits.startsWith(code);
}

// true when the number was written in international form ("+86" or "0086"),
// i.e. the user already stated the country and no need to add.
export function hasInternationalPrefix(phone: string): boolean {
  const cleaned = String(phone || '')
    .trim()
    .replace(/[^\d+]/g, '');
  return cleaned.startsWith('+') || cleaned.startsWith('00');
}
