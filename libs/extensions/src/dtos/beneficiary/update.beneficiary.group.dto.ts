import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { UUID, randomUUID } from "crypto";

class Beneficiary {
    @ApiProperty({
        example: randomUUID().toString(),
        description: 'Beneficiary UUID',
    })
    @IsUUID()
    uuid: string;
}

export class UpdateBeneficiaryGroupDto {
    @ApiProperty({
        example: '0-0-0-0',
        description: 'Beneficiary Group ID',
    })
    @IsString()
    uuid: UUID;

    @ApiProperty({
        example: 'John Doe',
        description: 'Beneficiary Group Name',
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({
        example: [{ uuid: randomUUID().toString() }],
        description: 'Array of beneficiaries',
        type: [Beneficiary],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Beneficiary)
    beneficiaries: Beneficiary[];
}