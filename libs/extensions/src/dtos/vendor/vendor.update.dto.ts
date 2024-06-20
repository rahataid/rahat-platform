import { ApiProperty } from "@nestjs/swagger";
import { IsObject, IsOptional, IsString } from "class-validator";


export class VendorUpdateDto {

    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ example: 'john@mailinator.com', required: false })
    @IsString()
    @IsOptional()
    email?: string;

    @ApiProperty({ example: '9834123456', required: false })
    @IsString()
    @IsOptional()
    phone?: string;


    @ApiProperty({ example: { isVendor: true }, required: false })
    @IsObject()
    @IsOptional()
    extras?: object;
}