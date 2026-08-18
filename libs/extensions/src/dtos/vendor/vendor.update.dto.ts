import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@rahataid/sdk/enums';
import { IsArray, IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';
import { UUID } from 'crypto';

export class ProjectVendorUpdateDto {
  @ApiProperty({ example: 'project-uuid', required: false })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  canSyncWalkin?: boolean;
}

export class VendorUpdateDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'john@mailinator.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '9834123456', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'UNKNOWN', required: false })
  @IsString()
  @IsOptional()
  gender?: Gender;

  @ApiProperty({ example: '0-0-0-0', required: false })
  @IsString()
  @IsOptional()
  wallet?: UUID;

  @ApiProperty({ example: { isVendor: true }, required: false })
  @IsObject()
  @IsOptional()
  extras?: object;

  @ApiProperty({ type: [ProjectVendorUpdateDto], required: false })
  @IsArray()
  @IsOptional()
  projectVendorUpdates?: ProjectVendorUpdateDto[];
}
