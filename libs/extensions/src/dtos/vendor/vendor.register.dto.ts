import { ApiProperty } from '@nestjs/swagger';
import { VendorCreateInput } from '@rahataid/sdk';
import { Service } from '@rumsan/sdk/enums';
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';
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

  @ApiProperty({ example: { isVendor: true }, required: false })
  @IsObject()
  extras?: object;
}
