import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, IsUUID, ValidateNested } from 'class-validator';
import { randomUUID } from 'crypto';

class Beneficiary {
  @ApiProperty({
    example: randomUUID().toString(),
    description: 'Beneficiary UUID',
  })
  @IsUUID()
  uuid: string;
}

export class CreateBeneficiaryGroupsDto {
  @ApiProperty({
    example: 'Group Name',
    description: 'Name of the beneficiary group',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: [{ uuid: randomUUID().toString() }],
    description: 'Array of beneficiaries',
    type: [Beneficiary],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Beneficiary)
  beneficiaries: Beneficiary[];
}
