import { generateRandomWallet } from '@rahataid/sdk/utils';
import { parse } from 'csv-parse/sync';
import { STANDARD_FIELD_MAP, VALID_GENDERS } from './imports.constants';

export interface MappedRow {
  rowIndex: number;
  beneficiary: Record<string, any>;
  pii: Record<string, any>;
  extras: Record<string, any>;
}

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

  // Handle name joining from firstName and lastName
  const fName = extras['firstName'] || extras['firstname'] || extras['FirstName'];
  const lName = extras['lastName'] || extras['lastname'] || extras['LastName'];

  if (fName || lName) {
    pii.name = `${fName || ''} ${lName || ''}`.trim();
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
    if (!(VALID_GENDERS as readonly string[]).includes(beneficiary.gender)) {
      beneficiary.gender = 'UNKNOWN';
    }
  }

  return { rowIndex: rowIndex + 1, beneficiary, pii, extras };
}

function convertValue(field: string, value: string): any {
  if (value === undefined || value === '') return undefined;

  switch (field) {
    case 'age': {
      const n = parseInt(value, 10);
      return Number.isNaN(n) ? undefined : n;
    }
    case 'latitude':
    case 'longitude': {
      const n = parseFloat(value);
      return Number.isNaN(n) ? undefined : n;
    }
    case 'birthDate': {
      const d = new Date(value);
      return isNaN(d.getTime()) ? undefined : d;
    }
    default:
      return value;
  }
}
