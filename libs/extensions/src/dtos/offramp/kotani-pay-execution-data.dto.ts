import { ApiProperty } from '@nestjs/swagger';
import { KotaniPayExecutionData } from '@rahataid/sdk';
import { IsNotEmpty, IsString } from 'class-validator';

export class KotaniPayExecutionDto implements KotaniPayExecutionData {
    @ApiProperty({ description: 'The blockchain network' })
    @IsNotEmpty()
    @IsString()
    chain: string;

    @ApiProperty({ description: 'The token used for the transaction' })
    @IsNotEmpty()
    @IsString()
    token: string;

    @ApiProperty({ description: 'The transaction hash' })
    @IsNotEmpty()
    @IsString()
    transaction_hash: string;

    @ApiProperty({ description: 'The wallet ID' })
    @IsNotEmpty()
    @IsString()
    wallet_id: string;

    @ApiProperty({ description: 'The request ID' })
    @IsNotEmpty()
    @IsString()
    request_id: string;

    @ApiProperty({ description: 'The customer key' })
    @IsNotEmpty()
    @IsString()
    customer_key: string;
}
