import { ApiProperty } from "@nestjs/swagger";
import { Service } from "@rumsan/sdk/enums";
import { IsString } from "class-validator";

export class GetVendorOtp {
    @ApiProperty({ example: Service.EMAIL })
    @IsString()
    service: Service;

    @ApiProperty({ example: 'john@mailinator.com', required: true })
    @IsString()
    address: string

}

export class VerifyVendorOtp {
    @ApiProperty({ example: '' })
    @IsString()
    challenge: string

    @ApiProperty({ example: 'john@mailinator.com', required: true })
    @IsString()
    address: string

    @ApiProperty({ example: '' })
    @IsString()
    otp: string

    @ApiProperty({ example: Service.EMAIL })
    service: Service | null
}