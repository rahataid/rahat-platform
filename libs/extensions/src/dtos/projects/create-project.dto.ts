import { OmitType, PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus } from '@rahataid/sdk/enums';
import { IsObject, IsOptional, IsString } from 'class-validator';

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
    required: false,
    example: 'Some extra Descriptions',
  })
  @IsOptional()
  @IsObject()
  extras?: object;

}

export class UpdateProjectDto extends OmitType(PartialType(CreateProjectDto), [
  'type',
]) {

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
