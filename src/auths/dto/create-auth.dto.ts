import { ApiProperty } from '@nestjs/swagger';

export class CreateAuthDto {}

export class WalletLoginDto {
  @ApiProperty({
    description: 'Wallet address',
    example: '0x1234567890',
  })
  walletAddress: string;
}
