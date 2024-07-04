import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString } from "class-validator";

export class CreateTokenDto {
    @ApiProperty({
        type: 'string',
        required: true,
        example: 'Rahat Token',
    })
    @IsString()
    name: string;

    @ApiProperty({
        type: 'string',
        required: true,
        example: 'RHT',
    })
    @IsString()
    @IsOptional()
    symbol: string;

    @ApiProperty({
        type: 'string',
        required: true,
        example: 'This is Rahat Token',
    })
    @IsString()
    description?: string;

    @ApiProperty({
        required: false,
        example: 18,
    })
    @IsInt()
    decimals: number;

    @ApiProperty({
        required: false,
        example: 1000,
    })
    @IsOptional()
    initialSupply: number;

    @ApiProperty({
        required: true,
        example: 235
    })
    @IsInt()
    fromBlock: number;

    @ApiProperty({
        required: true,
        example: '0x40BdA327da6460B106001709ef2F730825c634D8'
    })
    @IsString()
    contractAddress: `0x${string}`;

    @ApiProperty({
        required: false,
        example: '0x9c6d83987ff6dfd81b4e428b4f4c468d2769b451ca2d4c31b99bb338e8cbeec9',
    })
    @IsString()
    transactionHash?: string;
}
