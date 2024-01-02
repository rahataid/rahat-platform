import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

interface VendorFilter {
  name?: string;
  phone?: string;
  orderBy?: string;
  walletAddress?: string;
}

export class ListVendorDto {
  @ApiProperty({
    description: 'Page to load',
    example: '1',
    required: false,
  })
  @IsString()
  @IsOptional()
  page?: string;

  @ApiProperty({
    example: '10',
    required: false,
  })
  @IsString()
  @IsOptional()
  perPage?: string;

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsOptional()
  name?: VendorFilter['name'];

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsOptional()
  phone?: VendorFilter['phone'];

  @ApiProperty({
    type: 'string',
    required: false,
  })
  @IsOptional()
  // @IsEthereumAddress()
  walletAddress?: VendorFilter['walletAddress'];

  @ApiProperty({
    type: 'string',
    required: false,
  })
  orderBy: VendorFilter['orderBy'];
}

export class RequestTokenFromBeneficiaryDto {
  @ApiProperty({
    description: 'to',
    example: '0x1e5d0b89701670190c42478b1b12859cb941cf77',
    required: true,
  })
  @IsString()
  @IsOptional()
  to?: string;

  @ApiProperty({
    description: 'amount',
    example: '10',
    required: true,
  })
  @IsString()
  @IsOptional()
  amount?: string;
}

export class ProcessTokenRequest {
  @ApiProperty({
    description: 'Beneficiary Address',
    example: '0x1e5d0b89701670190c42478b1b12859cb941cf77',
    required: true,
  })
  @IsString()
  @IsOptional()
  beneficiary?: string;

  @ApiProperty({
    description: 'OTP',
    example: '4430',
    required: true,
  })
  @IsString()
  @IsOptional()
  otp?: string;
}
