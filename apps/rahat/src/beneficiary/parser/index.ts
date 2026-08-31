// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { BadRequestException } from '@nestjs/common';
import { CreateBeneficiaryDto } from '@rahataid/extensions';
import { Enums } from '@rahataid/sdk';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
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
    throw new BadRequestException({
      message: 'Only allowed JSON and EXCEL docType',
      code: 'ONLY_JSON_OR_EXCEL_DOC',
    });
  const parsedData =
    docType === Enums.UploadFileType.JSON
      ? JsonParser(buffer)
      : ExcelParser(buffer);

  const validationErrors = [];
  const beneficiaries = [];

  // Validate each row
  for (const row of parsedData) {

    const beneficiaryDto = plainToClass(CreateBeneficiaryDto, row);

    const errors = await validate(beneficiaryDto);

    if (errors.length > 0) {
      validationErrors.push({
        row,
        errors: errors.map((error) => Object.values(error.constraints)),
      });
    } else {
      beneficiaries.push(row);
    }
  }
  // If any validation errors, throw exception
  if (validationErrors.length > 0) {
    throw new BadRequestException({
      message: `Validation errors found in ${validationErrors.length} row(s)`,
      code: 'BENEFICIARY_IMPORT_VALIDATION_ERRORS',
      params: { count: validationErrors.length },
      errors: validationErrors,
    });
  }
  return beneficiaries;
}
