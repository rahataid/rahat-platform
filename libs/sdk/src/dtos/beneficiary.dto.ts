import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsIn,
  Length,
  Matches,
  IsEmail,
  IsObject,
  IsUUID,
} from 'class-validator';
import { PaginationDto } from '@rumsan/core';
import { Gender, BeneficiaryType } from '../enums';
import { PartialType } from '@nestjs/mapped-types';

export class CreateBeneficiaryDto {
  @ApiProperty({
    type: 'string',
    example: 'd8f61ebb-ae83-4a8b-8f36-ed756aa27d12',
  })
  @IsOptional()
  @IsUUID()
  referrerVendor?: string;

  @ApiProperty({
    type: 'string',
    example: 'd8f61ebb-ae83-4a8b-8f36-ed756aa27d12',
  })
  @IsOptional()
  @IsUUID()
  referrerBeneficiary?: string;
  @ApiProperty({
    type: 'string',
    example: 'Ram Dhakal',
    description: 'fullName',
  })
  @IsString()
  fullName: string;

  @ApiProperty({
    type: 'string',
    example: BeneficiaryType.REFERRED,
  })
  @IsOptional()
  type: BeneficiaryType;

  @ApiProperty({
    type: 'string',
    example: Gender.MALE,
  })
  @IsString()
  @IsOptional()
  gender?: Gender;

  @ApiProperty({
    type: 'string',
    example: 'lalitpur',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    type: 'number',
    example: '26',
  })
  @IsNumber()
  @IsOptional()
  age?: number;

  @ApiProperty({
    type: 'string',
    example: '9785623749',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    type: 'string',
    example: '977',
  })
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiProperty({
    type: 'string',
    example: 'd8f61ebb-ae83-4a8b-8f36-ed756aa27d12',
  })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiProperty({
    example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    description: 'Ethereum address',
    format: 'hex',
    minLength: 42,
    maxLength: 42,
  })
  @IsString()
  @Length(42, 42, {
    message: 'The Ethereum address must be 42 characters long',
  })
  @Matches(/^0x[a-fA-F0-9]{40}$/, {
    message:
      'Invalid Ethereum address format. It should start with "0x" and followed by 40 hexadecimal characters.',
  })
  walletAddress?: any;

  @ApiProperty({
    type: 'string',
    example: 'ram@mailinator.com',
  })
  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    format: 'json',
    description: 'Additional JSON data',
    required: false,
    example: {
      home: '98670023857',
      work: '36526012',
    },
  })
  @IsOptional()
  extras?: any;
}

export class UpdateBeneficiaryDto extends PartialType(CreateBeneficiaryDto) {}

export class ListBeneficiaryDto extends PaginationDto {
  @IsIn(['createdAt', 'updatedAt', 'fullName', 'gender'])
  override sort: string = 'createdAt';
  override order: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ example: 'd8f61ebb-ae83-4a8b-8f36-ed756aa27d12' })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ example: 'MALE' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: 'REFERRED' })
  @IsString()
  @IsOptional()
  type?: string;
}
