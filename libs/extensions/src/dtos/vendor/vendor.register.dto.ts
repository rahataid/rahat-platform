import { ApiProperty } from '@nestjs/swagger';
import { VendorCreateInput } from '@rahataid/sdk';
import { Service } from '@rumsan/sdk/enums/enums';
import { IsEthereumAddress, IsOptional, IsString } from 'class-validator';

export class VendorRegisterDto implements VendorCreateInput {
  @ApiProperty({ example: Service.EMAIL })
  @IsString()
  service: Service;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

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
