import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Allow, IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class SeedSettingItemDto {
  @ApiProperty({ example: 'COMMUNICATION' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Raw value — objects as JSON string or plain object',
    example: '{"URL":"https://connect.rumsan.net/api/v1","APP_ID":"1"}',
  })
  @Allow()
  value: string | number | boolean | object;

  @ApiPropertyOptional({ example: 'OBJECT', enum: ['STRING', 'NUMBER', 'BOOLEAN', 'OBJECT'] })
  @IsString()
  @IsOptional()
  dataType?: string;

  @ApiPropertyOptional({
    description: 'JSON string array or array of required field names',
    example: '["URL","APP_ID"]',
  })
  @IsOptional()
  requiredFields?: string | string[];

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isReadOnly?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}

export class SeedSettingsDto {
  @ApiProperty({ type: [SeedSettingItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeedSettingItemDto)
  settings: SeedSettingItemDto[];
}

export class CreateSiteSettingDto {
  @ApiProperty({ description: 'Brand name' })
  @IsString()
  @IsNotEmpty()
  brandName: string;

  @ApiProperty({ description: 'Brand description' })
  @IsString()
  @IsNotEmpty()
  brandDescription: string;
}

export class UpdateSiteSettingDto {
  @ApiPropertyOptional({ description: 'Brand name' })
  @IsString()
  @IsOptional()
  BRAND_NAME?: string;

  @ApiPropertyOptional({ description: 'Brand description' })
  @IsString()
  @IsOptional()
  BRAND_DESCRIPRTION?: string;

  @ApiPropertyOptional({ description: 'Brand logo URL' })
  @IsString()
  @IsOptional()
  BRRAND_LOGO?: string;

  @ApiPropertyOptional({ description: 'Site background image URL' })
  @IsString()
  @IsOptional()
  SITE_BACKGROUND_IMAGE?: string;
}