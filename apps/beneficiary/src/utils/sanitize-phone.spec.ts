import { sanitizePhone } from './sanitize-data';

describe('international beneficiary phones', () => {
  it.each([
    ['+254 712 345 678', 'NP', '+254712345678'],
    ['+1 (202) 555-0123', 'NP', '+12025550123'],
    ['9812345678', 'NP', '+9779812345678'],
    ['0712345678', 'KE', '+254712345678'],
  ])('normalizes %s using region %s', (input, region, expected) => {
    expect(sanitizePhone(input, region)).toBe(expected);
  });

  it('preserves missing phones and rejects invalid values', () => {
    expect(sanitizePhone(undefined)).toBeNull();
    expect(() => sanitizePhone('+254123')).toThrow('Invalid beneficiary phone number');
    expect(() => sanitizePhone('not a phone')).toThrow('Invalid beneficiary phone number');
  });
});
