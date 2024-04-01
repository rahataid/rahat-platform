import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VendorAddToProjectDto {
  @ApiProperty({ example: 'd8f61ebb-ae83-4a8b-8f36-ed756aa27d12' })
  @IsString()
  projectId: string | undefined;

  @ApiProperty({ example: 'd8f61ebb-ae83-4a8b-8f36-ed756aa27d12' })
  @IsString()
  vendorId: string | undefined;
}
