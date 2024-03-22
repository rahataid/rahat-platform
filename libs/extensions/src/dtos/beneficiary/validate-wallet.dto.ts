import { ApiProperty } from "@nestjs/swagger";
import { ValidateWallet } from "@rahataid/sdk";
import { IsString } from "class-validator";

export class ValidateWalletDto implements ValidateWallet {
    @ApiProperty({
        example: 'f525e780ee8a0681f9e3e5306cc2f285765f57d2f89ef29e8e13a58563d7faabd90df875241426f1a83b27d81a0ca7d9',
        description: 'Encrypted Data',
    })
    @IsString()
    encryptedData: string;

    @ApiProperty({
        example: "0x17469fF5Bdc86a5FCeb4604534fF2a47a821d421",
        description: 'Wallet Address',
    })
    @IsString()
    walletAddress: string;
}