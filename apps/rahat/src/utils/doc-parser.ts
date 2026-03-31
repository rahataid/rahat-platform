// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { Enums } from '@rahataid/sdk';
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
  return parsedData

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