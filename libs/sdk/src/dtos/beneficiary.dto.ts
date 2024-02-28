import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@rumsan/core';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { UUID } from 'crypto';
import { BankedStatus, Gender, InternetStatus, PhoneStatus } from '../enums';
import { TBeneficiary, TPIIData } from '../types';

export class CreateBeneficiaryDto implements TBeneficiary {
  @ApiProperty({
    type: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'UUID of the beneficiary',
  })
  uuid?: UUID;

  @ApiProperty({
    example: '1997-03-08',
    description: 'Date of birth in the YYYY-MM-DD format.',
  })
  @IsDate()
  @IsOptional()
  birthDate?: Date;

  @ApiProperty({
    type: 'string',
    example: Gender.FEMALE,
    description: 'Gender ',
  })
  @IsString()
  @IsOptional()
  gender?: Gender;

  @ApiProperty({
    type: 'string',
    example: 'lalitpur',
    description: 'location of the beneficiary',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    type: 'number',
    example: '26.24',
    description: 'Latitude of community',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({
    type: 'number',
    example: '86.24',
    description: 'longitude of community',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({
    type: 'string',
    example: '9785623749',
    description: 'Notes to remember',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    description: 'Ethereum address',
    format: 'hex',
    minLength: 42,
    maxLength: 42,
  })
  @IsOptional()
  @IsString()
  @Length(42, 42, {
    message: 'The Ethereum address must be 42 characters long',
  })
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message:
      'Invalid Ethereum address format. It should start with "0x" and followed by 40 hexadecimal characters.',
  })
  walletAddress?: string;

  @ApiProperty({
    format: 'json',
    description: 'Additional JSON data',
    required: false,
    example: {
      hasCitizenship: true,
      passportNumber: '1234567',
    },
  })
  @IsOptional()
  extras?: any;

  @ApiProperty({
    type: 'string',
    example: 'BANKED',
    description: 'beneficiary bankin access',
  })
  @IsOptional()
  @IsString()
  @IsEnum(BankedStatus)
  bankedStatus?: BankedStatus;

  @ApiProperty({
    type: 'string',
    example: 'HOME_INTERNET',
    description: 'Beneficiary internet access',
  })
  @IsOptional()
  @IsString()
  @IsEnum(InternetStatus)
  internetStatus?: InternetStatus;

  @ApiProperty({
    type: 'string',
    example: 'FEATURE_PHONE',
    description: 'Beneficiary phone ownership',
  })
  @IsOptional()
  @IsString()
  @IsEnum(PhoneStatus)
  phoneStatus?: PhoneStatus;

  @ApiProperty({
    format: 'json',
    description: 'Optional PII data for specific use cases',
    required: false,
    example: {
      name: 'Ram Shrestha',
      phone: '98670023857',
      extras: {
        bank: 'Laxmi Bank',
        account: '9872200001',
      },
    },
  })
  @IsOptional()
  piiData?: TPIIData;
}

export class UpdateBeneficiaryDto extends PartialType(CreateBeneficiaryDto) {}

export class ListBeneficiaryDto extends PaginationDto {
  @IsIn(['createdAt', 'updatedAt', 'gender'])
  override sort: string = 'createdAt';
  override order: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ example: 'MALE' })
  @IsString()
  @IsOptional()
  gender?: string;
}

export class AddToProjectDto {
  @ApiProperty({ example: 'd8f61ebb-ae83-4a8b-8f36-ed756aa27d12' })
  @IsString()
  projectId: string;

  @ApiProperty({ example: 'd8f61ebb-ae83-4a8b-8f36-ed756aa27d12' })
  @IsString()
  beneficiaryId: string;
}
