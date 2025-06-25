import { ApiProperty } from "@nestjs/swagger";
import { GroupPurpose } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { UUID } from "crypto";

export class AddGroupsPurposeDto {
    @ApiProperty({
        example: '0-0-0-0-0',
        description: 'Beneficiary ID',
    })
    @IsString()
    @IsOptional()
    uuid?: UUID;

    @ApiProperty({
        example: 'BANK_TRANSFER',
        description: 'Payout Mechanisms',
        enum: GroupPurpose
    })
    @IsEnum(GroupPurpose, { message: 'groupPurpose must be a valid value' })
    groupPurpose: GroupPurpose
}