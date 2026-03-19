import { parse } from 'csv-parse/sync';
import { generateRandomWallet } from '@rahataid/sdk/utils';

export interface MappedRow {
  rowIndex: number;
  beneficiary: Record<string, any>;
  pii: Record<string, any>;
  extras: Record<string, any>;
}

const STANDARD_FIELD_MAP: Record<string, { table: 'beneficiary' | 'pii'; field: string }> = {
  'name': { table: 'pii', field: 'name' },
  'phone': { table: 'pii', field: 'phone' },
  'email': { table: 'pii', field: 'email' },
  'gender': { table: 'beneficiary', field: 'gender' },
  'walletaddress': { table: 'beneficiary', field: 'walletAddress' },
  'birthdate': { table: 'beneficiary', field: 'birthDate' },
  'age': { table: 'beneficiary', field: 'age' },
  'location': { table: 'beneficiary', field: 'location' },
  'latitude': { table: 'beneficiary', field: 'latitude' },
  'longitude': { table: 'beneficiary', field: 'longitude' },
  'notes': { table: 'beneficiary', field: 'notes' },
  'bankedstatus': { table: 'beneficiary', field: 'bankedStatus' },
  'internetstatus': { table: 'beneficiary', field: 'internetStatus' },
  'phonestatus': { table: 'beneficiary', field: 'phoneStatus' },
};

export function parseCSVBuffer(buffer: Buffer): { headers: string[]; rows: Record<string, string>[] } {
  const records = parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[];
  const headers = records.length > 0 ? Object.keys(records[0]) : [];
  return { headers, rows: records };
}

export function mapCSVRows(rows: Record<string, string>[]): MappedRow[] {
  return rows.map((row, index) => mapCSVRow(row, index));
}

function mapCSVRow(row: Record<string, string>, rowIndex: number): MappedRow {
  const beneficiary: Record<string, any> = {};
  const pii: Record<string, any> = {};
  const extras: Record<string, any> = {};

  for (const [csvColumn, value] of Object.entries(row)) {
    const normalizedKey = csvColumn.toLowerCase().trim().replace(/\s+/g, '');
    const mapping = STANDARD_FIELD_MAP[normalizedKey];

    if (mapping) {
      const converted = convertValue(mapping.field, value);
      if (mapping.table === 'beneficiary') {
        beneficiary[mapping.field] = converted;
      } else {
        pii[mapping.field] = converted;
      }
    } else {
      if (value !== undefined && value !== '') {
        extras[csvColumn] = value;
      }
    }
  }

  // Generate wallet address if not provided
  if (!beneficiary.walletAddress) {
    const { address } = generateRandomWallet();
    beneficiary.walletAddress = address;
  }

  // Normalize phone to string
  if (pii.phone !== undefined) {
    pii.phone = String(pii.phone).trim();
  }

  // Normalize gender to uppercase enum value
  if (beneficiary.gender) {
    beneficiary.gender = String(beneficiary.gender).toUpperCase();
    if (!['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'].includes(beneficiary.gender)) {
      beneficiary.gender = 'UNKNOWN';
    }
  }

  return { rowIndex: rowIndex + 1, beneficiary, pii, extras };
}

function convertValue(field: string, value: string): any {
  if (value === undefined || value === '') return undefined;

  switch (field) {
    case 'age':
      return parseInt(value, 10) || undefined;
    case 'latitude':
    case 'longitude':
      return parseFloat(value) || undefined;
    case 'birthDate':
      return new Date(value) || undefined;
    default:
      return value;
  }
}
