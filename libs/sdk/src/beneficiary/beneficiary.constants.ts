export const Client = 'BEN_CLIENT';

export const Types = {
  REFERRED: 'REFERRED',
  ENROLLED: 'ENROLLED',
};

// Sentinel placeholder phone for beneficiaries created without a phone number.
// A DB trigger replaces this with a derived '+000999<seq>' number on insert.
export const UNPHONED_PLACEHOLDER = '0009999999999';
