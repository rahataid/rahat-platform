import { hasCallingCode, hasInternationalPrefix } from './validateCountryCode';

describe('hasInternationalPrefix', () => {
  it('should detect a leading +', () => {
    expect(hasInternationalPrefix('+8613800001111')).toBe(true);
  });

  it('should detect a leading 00', () => {
    expect(hasInternationalPrefix('008613800001111')).toBe(true);
  });

  it('should detect a + that is not the first character', () => {
    expect(hasInternationalPrefix('(+86) 138 0000 1111')).toBe(true);
  });

  it('should return false for a local number', () => {
    expect(hasInternationalPrefix('013800001111')).toBe(false);
  });

  it('should return false for a leading single zero', () => {
    expect(hasInternationalPrefix('013800001111')).toBe(false);
  });

  it('should ignore surrounding whitespace', () => {
    expect(hasInternationalPrefix('  +8613800001111  ')).toBe(true);
  });

  it('should return false for an empty phone', () => {
    expect(hasInternationalPrefix('')).toBe(false);
  });

  it('should return false for a null or undefined phone', () => {
    expect(hasInternationalPrefix(null as unknown as string)).toBe(false);
    expect(hasInternationalPrefix(undefined as unknown as string)).toBe(false);
  });
});

describe('hasCallingCode', () => {
  it('should match a number that already has the calling code', () => {
    expect(hasCallingCode('8613800001111', '86')).toBe(true);
  });

  it('should accept the calling code written with a "+"', () => {
    expect(hasCallingCode('8613800001111', '+86')).toBe(true);
  });

  it('should not match a local-only number', () => {
    expect(hasCallingCode('13800001111', '86')).toBe(false);
  });

  it('should not match another country calling code', () => {
    expect(hasCallingCode('9779843777474', '86')).toBe(false);
  });

  it('should not treat a local number as prefixed just because it starts with a short code', () => {
    // libphonenumber will happily report calling code 20/7 for these, but they
    // are not valid numbers — without the validity check they would be left
    // unprefixed. Only relevant if COUNTRY_CODE_SETTINGS moves to a 1-2 digit
    // code; "86" is unaffected either way.
    expect(hasCallingCode('201234567', '20')).toBe(false);
    expect(hasCallingCode('7123456789', '7')).toBe(false);
  });

  it('should still match real numbers that carry a short calling code', () => {
    expect(hasCallingCode('201001234567', '20')).toBe(true);
    expect(hasCallingCode('79161234567', '7')).toBe(true);
  });

  it('should not add the code twice when the digits cannot be parsed', () => {
    expect(hasCallingCode('86', '86')).toBe(true);
  });

  it('should ignore formatting characters in the phone', () => {
    expect(hasCallingCode('+86 138 0000 1111', '86')).toBe(true);
  });

  it('should return false when either argument is empty', () => {
    expect(hasCallingCode('', '86')).toBe(false);
    expect(hasCallingCode('8613800001111', '')).toBe(false);
  });

  it('should return false when either argument has no digits', () => {
    expect(hasCallingCode('not-a-phone', '86')).toBe(false);
    expect(hasCallingCode('8613800001111', '+')).toBe(false);
  });

  it('should return false for a null or undefined phone', () => {
    expect(hasCallingCode(null as unknown as string, '86')).toBe(false);
    expect(hasCallingCode(undefined as unknown as string, '86')).toBe(false);
  });
});
