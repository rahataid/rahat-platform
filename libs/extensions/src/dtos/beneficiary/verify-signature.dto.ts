import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";


export class VerifySignatureDto {
    @ApiProperty({
        example: "eJwFwQkBwDAIBDBLQClX5obXv4Ql3SemI7ILZgnQjRt0ZVdU630O21sgZCmpzFDZKp5Z19vgr6X9Cef41oEz6CCIxxlcliLiZnSrrB4dG lK9wkPxRgHWnpPJ9S2qd193g9n5Cm9",
        description: 'Encrypted Data',
    })
    @IsString()
    encryptedData: string;



}