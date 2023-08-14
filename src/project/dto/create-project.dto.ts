import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    type: 'string',
    required: true,
    example: 'Blood Bank',
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: 'string',
    required: true,
    example: '2022-01-05T12:34:56.789Z',
  })
  @IsString()
  startDate: string;

  @ApiProperty({
    type: 'string',
    required: true,
    example: '2022-01-15T12:34:56.789Z',
  })
  @IsString()
  endDate: string;

  @ApiProperty({
    required: true,
    example: '0x1234567890123456789012345678901234567890',
  })
  @IsString()
  @IsNotEmpty()
  contractAddress: string;

  @ApiProperty({
    type: 'string',
    required: false,
    example: 'New York',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    type: 'string',
    required: false,
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  projectManager?: string;

  @ApiProperty({
    type: 'string',
    required: false,
    example: 'A project about blood donation',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    type: 'number',
    required: false,
    example: 1,
  })
  @IsNumber()
  @IsOptional()
  owner?: number;

  @ApiProperty({
    type: 'string',
    required: false,
    example: 'Healthcare',
  })
  @IsString()
  @IsOptional()
  projectType?: string;

  @ApiProperty({
    type: 'number',
    required: false,
    example: 100000,
  })
  @IsNumber()
  @IsOptional()
  budget?: number;

  @ApiProperty({
    type: 'number',
    required: false,
    example: 50000,
  })
  @IsNumber()
  @IsOptional()
  disbursed?: number;

  @ApiProperty({
    type: 'string',
    required: false,
    example: 'Some extra information',
  })
  @IsString()
  @IsOptional()
  extras?: string;

  @ApiProperty({
    type: 'string',
    required: false,
    example: null,
  })
  @IsString()
  @IsOptional()
  deletedAt?: string;

  @ApiProperty({
    type: 'boolean',
    required: false,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isApproved?: boolean;
}
