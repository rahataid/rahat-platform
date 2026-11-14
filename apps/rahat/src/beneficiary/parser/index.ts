// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { CreateBeneficiaryDto } from '@rahataid/extensions';
import { Enums } from '@rahataid/sdk';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { ExcelParser } from './excel.parser';
import { JsonParser } from './json.parser';

export async function DocParser(
  docType: Enums.UploadFileType,
  buffer: Buffer
): Promise<CreateBeneficiaryDto[]> {
  if (
    docType !== Enums.UploadFileType.JSON &&
    docType !== Enums.UploadFileType.EXCEL
  )
    throw new Error('Only allowed JSON and EXCEL docType');
  const parsedData =
    docType === Enums.UploadFileType.JSON
      ? JsonParser(buffer)
      : ExcelParser(buffer);

  const validationErrors = [];
  const beneficiaries = [];

  // Validate each row
  for (const [index, row] of parsedData.entries()) {

    const beneficiaryDto = plainToClass(CreateBeneficiaryDto, row);

    const errors = await validate(beneficiaryDto);

    if (errors.length > 0) {
      validationErrors.push({
        row: index + 1,
        errors: flattenErrors(errors),
      });
    } else {
      beneficiaries.push(row);
    }

    function flattenErrors(errors: ValidationError[]): string[] {
      return errors.flatMap((error) => [
        ...Object.values(error.constraints || {}),
        ...flattenErrors(error.children || []),
      ]);
    }
  }

  // If any validation errors, throw exception
  if (validationErrors.length > 0) {
    throw new Error('Validation errors: ' + JSON.stringify(validationErrors));
  }
  return beneficiaries;
}
