import { OmitType, PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
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
    required: false,
    example: 'A project about blood donation',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    type: 'string',
    required: false,
    example: 'anticipatory-action',
  })
  @IsString()
  type: string;

  @ApiProperty({
    type: 'string',
    required: false,
    example: 'Some extra information',
  })
  @IsString()
  @IsOptional()
  extras?: object;

  @ApiProperty({
    required: true,
    example: '0x1234567890123456789012345678901234567890',
  })
  @IsOptional()
  @IsString()
  contractAddress?: string;
}

export class UpdateProjectDto extends OmitType(PartialType(CreateProjectDto), [
  'type',
]) {}
