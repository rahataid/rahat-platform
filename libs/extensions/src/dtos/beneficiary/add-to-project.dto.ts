import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class AddToProjectDto {
  @ApiProperty({ example: 'd8f61ebb-ae83-4a8b-8f36-ed756aa27d12' })
  @IsString()
  projectId: string | undefined;

  @ApiProperty({ example: 'd8f61ebb-ae83-4a8b-8f36-ed756aa27d12' })
  @IsString()
  beneficiaryId: string | undefined;
}


export class AddBenfGroupToProjectDto {
  @ApiProperty({ example: 'd8f61ebb-ae83-4a8b-8f36-ed756aa27d12' })
  @IsString()
  projectId: string | undefined;

  @ApiProperty({ example: 'd8f61ebb-ae83-4a8b-8f36-ed756aa27d12' })
  @IsString()
  beneficiaryGroupId: string | undefined;
}
