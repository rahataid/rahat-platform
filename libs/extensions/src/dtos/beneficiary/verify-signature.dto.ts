import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class VerifySignatureDto {
    @ApiProperty({
        example: "eJwFwQkBwDAIBDBLQClX5obXv4Ql3SemI7ILZgnQjRt0ZVdU630O21sgZCmpzFDZKp5Z19vgr6X9Cef41oEz6CCIxxlcliLiZnSrrB4dG lK9wkPxRgHWnpPJ9S2qd193g9n5Cm9",
        description: 'Encrypted Data',
    })
    @IsString()
    encryptedData: string;

    @ApiProperty({
        example: "0x37711496d51fe097d5ff79b04cd60c32018de9a845c5f35178511f6c3cb59b693b2d0f50ff34556ba553eac68c28caef39cf8e14018c590634fea583a4ad53211b",
        description: 'Signature',
    })
    signature: string;
}