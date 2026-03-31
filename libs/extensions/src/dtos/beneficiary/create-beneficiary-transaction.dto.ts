import { ApiProperty } from "@nestjs/swagger";
import { Enums, TPIIData } from "@rahataid/sdk";
import { IsNumber, IsOptional, IsString, IsUUID } from "class-validator";
import { UUID } from "crypto";

export class CreateBeneficiaryTransactionDto {
    @ApiProperty({
        example: '11111111111111',
        description: 'Project id',
    })
    @IsUUID()
    projectId: UUID;

    @ApiProperty({
        type: 'string',
        example: Enums.Gender.FEMALE,
        description: 'Gender ',
    })
    @IsString()
    @IsOptional()
    gender?: Enums.Gender;

    @ApiProperty({
        example: 30,
        description: 'Age of the beneficiary',
    })
    @IsNumber()
    age: number;

    @ApiProperty({
        format: 'json',
        description: 'Optional PII data for specific use cases',
        required: false,
        example: {
            name: 'Ram Shrestha',
            phone: '98670023857',
            extras: {
                bank: 'Laxmi Bank',
                account: '9872200001',
            },
        },
    })
    @IsOptional()
    piiData: TPIIData;
}