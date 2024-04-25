import { OmitType, PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus } from '@rahataid/sdk/enums';
import { IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    type: 'string',
    required: true,
    example: 'Cash Distribution',
  })
  @IsString()
  name: string;

  @ApiProperty({
    type: 'string',
    required: false,
    example: 'Cash Distribution for the flood victims',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    type: 'string',
    required: false,
    example: 'el',
  })
  @IsString()
  type: string;

  @ApiProperty({
    type: 'string',
    required: false,
    example: 'Some extra Descriptions',
  })
  @IsString()
  @IsOptional()
  extras?: object;

}

export class UpdateProjectDto extends OmitType(PartialType(CreateProjectDto), [
  'type',
]) {
  @ApiProperty({
    type: 'string',
    example: 'Blood Bank',
  })
  @IsString()
  override name: string;

  @ApiProperty({
    type: 'string',
    required: false,
    example: 'A project about blood donation',
  })
  @IsString()
  @IsOptional()
  override description?: string;

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
  override extras?: object;
}

export class UpdateProjectStatusDto {

  @ApiProperty({
    type: 'string',
    required: false,
    example: 'Some extra information',
  })
  @IsString()
  @IsOptional()
  status?: ProjectStatus;
}
