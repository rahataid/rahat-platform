import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAuthDto {}

export class WalletLoginDto {
  @ApiProperty({
    description: 'Wallet address',
    example: '0x1234567890',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;
}
