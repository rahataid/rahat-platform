import * as xlsx from 'xlsx';

export function ExcelParser(buffer: Buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const parsedData = xlsx.utils.sheet_to_json(sheet);

  return parsedData;
}
