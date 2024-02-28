import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { Gender } from 'libs/sdk/src/enums';
import { ServiceType } from '../../constants';

export class VendorRegisterDto {
  @ApiProperty({ example: 'EMAIL' })
  @IsString()
  service: ServiceType;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'MALE' })
  @IsString()
  @IsOptional()
  gender: Gender;

  @ApiPropertyOptional({ example: 'john@mailinator.com' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '9834123456' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '0x000000000000000000000' })
  @IsString()
  @IsOptional()
  wallet?: string;

  @ApiPropertyOptional({ example: { isVendor: true } })
  extras?: any;
}
