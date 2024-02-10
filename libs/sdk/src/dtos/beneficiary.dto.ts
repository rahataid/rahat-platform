import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsIn,
  Length,
  Matches,
  IsEmail,
} from 'class-validator';
import { PaginationDto } from '@rumsan/core';
import { Gender } from '../enums';
import { PartialType } from '@nestjs/mapped-types';

export class CreateBeneficiaryDto {
  @ApiProperty({
    type: 'string',
    example: 'Ram',
    description: 'firstName',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    type: 'string',
    example: 'Sharma',
    description: 'lastName',
  })
  @IsString()
  lastName: string;

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
    description: 'Phone number',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

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
    type: 'string',
    example: 'ram@mailinator.com',
    description: 'email',
    required: false,
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
  @IsIn(['createdAt', 'updatedAt', 'firstName', 'lastName', 'gender'])
  override sort: string = 'createdAt';
  override order: 'asc' | 'desc' = 'desc';
}
