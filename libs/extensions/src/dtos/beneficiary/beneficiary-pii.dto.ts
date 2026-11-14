import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsOptional, IsString, Matches } from 'class-validator';

export const E164_PHONE_PATTERN = /^\+[1-9]\d{1,14}$/;
export const E164_PHONE_MESSAGE = 'Phone number must be in E.164 format, for example +9779812345678';

export class BeneficiaryPiiDto {
  @Allow()
  beneficiaryId?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '+9779812345678' })
  @IsString()
  @Matches(E164_PHONE_PATTERN, { message: E164_PHONE_MESSAGE })
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @Allow()
  extras?: Record<string, any>;
}

export class UpdateBeneficiaryPiiDto extends BeneficiaryPiiDto {
  @IsOptional()
  phone: string;
}
