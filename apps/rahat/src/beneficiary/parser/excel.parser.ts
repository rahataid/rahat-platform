import * as xlsx from 'xlsx';

export function ExcelParser(buffer: Buffer) {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  let parsedData = xlsx.utils.sheet_to_json(sheet);
  parsedData = parsedData.map((record) => {
    const newRecord = {};
    Object.keys(record).forEach((key) => {
      if (key.includes('.')) {
        // Split key into object field and nested field
        const [objField, nestedField] = key.split('.');
        // Initialize the object if it doesn't exist
        if (!newRecord[objField]) {
          newRecord[objField] = {};
        }
        // Assign the nested field value
        newRecord[objField][nestedField] = record[key];
      } else {
        // Copy other fields directly
        newRecord[key] = record[key];
      }
    });
    return newRecord;
  });

  return parsedData;
}
