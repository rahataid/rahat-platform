import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    type: 'string',
    required: true,
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: 'string',
    required: true,
  })
  @IsString()
  startDate: string;

  @ApiProperty({
    type: 'string',
    required: true,
  })
  @IsString()
  endDate: string;

  @ApiProperty({
    type: 'string',
    required: true,
  })
  @IsString()
  contractAddress: string;

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsString()
  @IsOptional()
  projectManager?: string;

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    type: 'number',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  owner?: number;

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsString()
  @IsOptional()
  projectType?: string;

  @ApiProperty({
    type: 'number',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  budget?: number;

  @ApiProperty({
    type: 'number',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  disbursed?: number;

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsString()
  @IsOptional()
  extras?: string;

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsString()
  @IsOptional()
  deletedAt?: string;

  @ApiProperty({
    type: 'boolean',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isApproved?: boolean;
}
