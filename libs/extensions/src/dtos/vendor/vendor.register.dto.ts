import { ApiProperty } from '@nestjs/swagger';
import { VendorCreateInput } from '@rahataid/sdk';
import { Service } from '@rumsan/sdk/enums';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class VendorRegisterDto {
  id?: number | undefined;
  uuid: string;
  location?: string | null | undefined;
  createdAt?: Date | undefined;
  updatedAt?: Date | null | undefined;
  deletedAt?: Date | null | undefined;
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

  //PATCH FIX
  @ApiProperty({ example: '0x000000000', required: false })
  @IsString()
  @IsOptional()
  authWallet?: string;

  @ApiProperty({ example: '0x000000000000000000000', required: false })
  @IsString()
  @IsOptional()
  // @IsEthereumAddress()
  wallet?: string;

  @ApiProperty({ example: { isVendor: true }, required: false })
  @IsObject()
  extras?: object;
}

export class VendorPasswordRegisterDto extends VendorRegisterDto {
  @ApiProperty({ example: 'john_vendor_1234' })
  @IsString()
  @MinLength(2, { message: 'Username must be at least 2 characters long' })
  username: string;

  @ApiProperty({ example: 'password' })
  @IsString()
  password: string;

  @ApiProperty({
    example: false,
    description:
      'If true, skips password strength validation (min length, uppercase, lowercase, digit, special character checks). Defaults to false.',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  bypassPasswordValidation?: boolean;
}

export class VendorPasswordLoginDto {
  @ApiProperty({ example: 'john@mailinator.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'password' })
  @IsString()
  password: string;
}
export class VendorSignupDto {
  @ApiProperty({ example: 'john@mailinator.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'password' })
  @IsString()
  password: string;
}
