import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { VendorCreateInput } from '@rahataid/sdk';
import { Service } from '@rumsan/sdk/enums';
import { IsArray, IsBoolean, IsObject, IsOptional, IsString, MinLength } from 'class-validator';
import { WalletDto } from '../beneficiary/wallet.dto';

export class VendorRegisterDto implements VendorCreateInput {
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

  @ApiProperty({
    example: [
      { chain: 'evm', address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', privateKey: '...' },
      { chain: 'stellar', address: 'GB...', privateKey: '...' }
    ], required: false
  })
  @IsArray()
  // @IsEthereumAddress()
  wallets: WalletDto[];

  @ApiProperty({ example: 'FEMALE', required: false })
  @IsString()
  @IsOptional()
  gender: Gender;

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
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
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