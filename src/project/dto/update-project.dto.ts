import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateProjectDto {
  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsNotEmpty()
  @IsString()
  startDate: string;

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsNotEmpty()
  @IsString()
  endDate: string;

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsNotEmpty()
  @IsString()
  location: string;

  @ApiProperty({
    type: 'string',
    required: false,
  })
  projectType: string;

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsNotEmpty()
  @IsString()
  projectManager: string;

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    type: 'boolean',
    required: false,
    default: false,
  })
  @IsOptional()
  isApproved?: boolean;
}

export class UpdateProjectCampaignDto {
  @ApiProperty({
    type: 'number',
    required: true,
    example: 1,
  })
  @IsNumber()
  id: number;
}
