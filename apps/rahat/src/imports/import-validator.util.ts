import { PrismaService } from '@rumsan/prisma';
import { MappedRow } from './csv-parser.util';

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  rowData: Record<string, any>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validates rows within the CSV dataset (no DB calls).
 * Checks: phone required, no duplicate phones within CSV.
 */
export function validateRows(mappedRows: MappedRow[], originalRows: Record<string, string>[]): ValidationResult {
  const errors: ValidationError[] = [];
  const phonesSeen = new Map<string, number>(); // phone -> first row index

  for (const row of mappedRows) {
    const phone = row.pii.phone;

    // Check phone exists
    if (!phone) {
      errors.push({
        row: row.rowIndex,
        field: 'phone',
        message: 'Phone number is required',
        rowData: originalRows[row.rowIndex - 1],
      });
      continue;
    }

    // Check duplicate phone within CSV
    const existingRow = phonesSeen.get(phone);
    if (existingRow !== undefined) {
      errors.push({
        row: row.rowIndex,
        field: 'phone',
        message: `Duplicate phone number "${phone}" (also in row ${existingRow})`,
        rowData: originalRows[row.rowIndex - 1],
      });
    } else {
      phonesSeen.set(phone, row.rowIndex);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates rows against the database.
 * Checks: phone uniqueness, walletAddress uniqueness.
 */
export async function validateAgainstDB(
  mappedRows: MappedRow[],
  originalRows: Record<string, string>[],
  prisma: PrismaService,
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];

  // Collect all phones and wallet addresses
  const phones = mappedRows
    .map((r) => r.pii.phone)
    .filter(Boolean);
  const walletAddresses = mappedRows
    .map((r) => r.beneficiary.walletAddress)
    .filter(Boolean);

  // Batch check phones against DB
  if (phones.length > 0) {
    const existingPii = await prisma.beneficiaryPii.findMany({
      where: { phone: { in: phones } },
      select: { phone: true },
    });
    const existingPhones = new Set(existingPii.map((p) => p.phone));

    for (const row of mappedRows) {
      if (row.pii.phone && existingPhones.has(row.pii.phone)) {
        errors.push({
          row: row.rowIndex,
          field: 'phone',
          message: `Phone number "${row.pii.phone}" already exists in the system`,
          rowData: originalRows[row.rowIndex - 1],
        });
      }
    }
  }

  // Batch check wallet addresses against DB
  if (walletAddresses.length > 0) {
    const existingBeneficiaries = await prisma.beneficiary.findMany({
      where: { walletAddress: { in: walletAddresses } },
      select: { walletAddress: true },
    });
    const existingWallets = new Set(existingBeneficiaries.map((b) => b.walletAddress));

    for (const row of mappedRows) {
      if (row.beneficiary.walletAddress && existingWallets.has(row.beneficiary.walletAddress)) {
        errors.push({
          row: row.rowIndex,
          field: 'walletAddress',
          message: `Wallet address "${row.beneficiary.walletAddress}" already exists in the system`,
          rowData: originalRows[row.rowIndex - 1],
        });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Generates a CSV buffer from error rows, adding an _error_reason column.
 */
export function generateErrorCSV(errors: ValidationError[]): Buffer {
  if (errors.length === 0) return Buffer.from('');

  // Get all columns from the first error row + _error_reason
  const sampleRow = errors[0].rowData;
  const columns = [...Object.keys(sampleRow), '_error_reason', '_row_number'];

  // Build CSV
  const lines: string[] = [];
  lines.push(columns.map(escapeCSVField).join(','));

  for (const error of errors) {
    const values = columns.map((col) => {
      if (col === '_error_reason') return error.message;
      if (col === '_row_number') return String(error.row);
      return error.rowData[col] ?? '';
    });
    lines.push(values.map(escapeCSVField).join(','));
  }

  return Buffer.from(lines.join('\n'), 'utf-8');
}

function escapeCSVField(value: string): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
