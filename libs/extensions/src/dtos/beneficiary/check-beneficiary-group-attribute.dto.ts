import { ApiProperty } from "@nestjs/swagger";
import { BeneficiaryGroupAttribute } from "@rahataid/sdk/enums";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { UUID } from "crypto";

export class CheckBeneficiaryGroupAttributeDto {
    @ApiProperty({
        example: '0-0-0-0',
        description: 'Beneficiary Group ID',
    })
    @IsString()
    @IsOptional()
    uuid?: UUID;

    @ApiProperty({
        example: 'PHONE',
        description: 'Group atribute',
        enum: BeneficiaryGroupAttribute
    })
    @IsEnum(BeneficiaryGroupAttribute, { message: 'group attribute must be a valid value' })
    attribute: BeneficiaryGroupAttribute

}