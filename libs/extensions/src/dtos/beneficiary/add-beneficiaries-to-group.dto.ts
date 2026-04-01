import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { randomUUID } from 'crypto';

class BeneficiaryUuid {
  @ApiProperty({
    example: randomUUID().toString(),
    description: 'Beneficiary UUID',
  })
  @IsUUID()
  uuid: string;
}

export class AddBeneficiariesToGroupDto {
  @ApiProperty({
    example: randomUUID().toString(),
    description: 'UUID of the existing beneficiary group',
  })
  @IsUUID()
  groupUuid: string;

  @ApiProperty({
    example: [{ uuid: randomUUID().toString() }],
    description: 'Array of beneficiaries to add to the group',
    type: [BeneficiaryUuid],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BeneficiaryUuid)
  beneficiaries: BeneficiaryUuid[];
}
