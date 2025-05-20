// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { CreateStakeholderDto } from '@rahataid/extensions';
import { Enums } from '@rahataid/sdk';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import xlsx from 'xlsx';


export async function DocParser(
  docType: Enums.UploadFileType,
  buffer: Buffer
): Promise<any[]> {
  if (
    docType !== Enums.UploadFileType.JSON &&
    docType !== Enums.UploadFileType.EXCEL
  )
    throw new Error('Only allowed JSON and EXCEL docType');
  const parsedData =
    docType === Enums.UploadFileType.JSON
      ? JsonParser(buffer)
      : ExcelParser(buffer);
  const data = parsedData.map((item) => ({
    name: item['Name']?.trim() || item['Stakeholders Name']?.trim() || '',
    designation: item['Designation']?.trim() || '',
    organization: item['Organization']?.trim() || '',
    district: item['District']?.trim() || '',
    municipality: item['Municipality']?.trim() || '',
    phone: item['Mobile #']?.toString().trim() || item['Phone Number']?.toString().trim() || '',
    email: item['Email ID']?.trim() || item['Email']?.trim() || ''
  }));
  const validationErrors = [];
  const stakeholders = [];
  for (const row of data) {

    const stakeholdersDto = plainToClass(CreateStakeholderDto, row);

    const errors = await validate(stakeholdersDto);

    if (errors.length > 0) {
      validationErrors.push({
        row,
        errors: errors.map((error) => Object.values(error.constraints)),
      });
    } else {
      stakeholders.push(row);
    }
  }

  // If any validation errors, throw exception
  if (validationErrors.length > 0) {
    console.log(validationErrors)
    const errorMessages = validationErrors.map((e, i) => {
      const flattenedErrors = e.errors.flat().join(', ');
      return `Row ${i + 1}: ${flattenedErrors}`;
    }).join(',');
    throw new Error(errorMessages);
  }
  return stakeholders

}

function ExcelParser(buffer: Buffer): any[] {
  const workbook = xlsx.read(buffer, {
    type: 'buffer',
    cellDates: true,
  });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Directly convert sheet to JSON (assumes flat structure)
  return xlsx.utils.sheet_to_json(sheet);
}

export function JsonParser(buffer: Buffer) {
  return JSON.parse(buffer.toString('utf8'));
}