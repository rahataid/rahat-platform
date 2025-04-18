import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateWalletDto {
    @ApiProperty({ example: "0000" })
    @IsString()
    id: number;


}
