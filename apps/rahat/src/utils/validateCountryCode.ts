import { parsePhoneNumberFromString } from 'libphonenumber-js';

// true when the number already carries the configured calling code.
export function hasCallingCode(phone: string, callingCode: string): boolean {
  const digits = String(phone || '').replace(/\D/g, '');
  const code = String(callingCode || '').replace(/\D/g, '');
  if (!digits || !code) return false;

  const parsed = parsePhoneNumberFromString(`+${digits}`);
  // validity rules out a local number that merely starts with a short code
  if (parsed) return parsed.countryCallingCode === code && parsed.isValid();

  // unparseable digits ("86"): prefix match still avoids adding the code twice
  return digits.startsWith(code);
}

// true when the number was written in international from ("+86" or "0086").
export function hasInternationalPrefix(phone: string): boolean {
  const cleaned = String(phone || '')
    .trim()
    .replace(/[^\d+]/g, '');
  return cleaned.startsWith('+') || cleaned.startsWith('00');
}
