import { OmitType, PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus } from '@rahataid/sdk/enums';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

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

  @ApiProperty({})
  @IsEnum(ProjectStatus, {
    message: 'status must be one of the following values: NOT_READY, ACTIVE, CLOSED',
  })
  status: ProjectStatus;

  @ApiProperty({
    required: false,
    example: { test: 'test' },
  })
  @IsOptional()
  @IsObject()
  extras?: object;

  @ApiProperty({
    required: false,
    example: '0x123'
  })
  @IsOptional()
  @IsString()
  contractAddress?: string
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
