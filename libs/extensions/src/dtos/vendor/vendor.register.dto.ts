import { ApiProperty } from '@nestjs/swagger';
import { Enums } from '@rahataid/sdk';
import { IsEthereumAddress, IsOptional, IsString } from 'class-validator';

export class VendorRegisterDto {
  @ApiProperty({ example: Enums.ServiceType.EMAIL })
  @IsString()
  service: Enums.ServiceType | undefined;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string | undefined;

  @ApiProperty({ example: Enums.Gender.MALE })
  @IsString()
  @IsOptional()
  gender: Enums.Gender | undefined;

  @ApiProperty({ example: 'john@mailinator.com', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '9834123456', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: '0x000000000000000000000', required: false })
  @IsString()
  @IsOptional()
  @IsEthereumAddress()
  wallet?: string;

  @ApiProperty({ example: { isVendor: true }, required: false })
  extras?: any;
}
