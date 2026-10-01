import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class WalletDto {
    @ApiProperty({ example: 'evm', description: 'Blockchain chain type' })
    @IsString()
    chain: string;

    @ApiProperty({ example: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', description: 'Wallet address' })
    @IsString()
    address: string;

    @ApiProperty({ example: '0x...', description: 'Private key (never expose in production)' })
    @IsString()
    @IsOptional()
    privateKey?: string;
}
