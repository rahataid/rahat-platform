import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, ValidateNested } from 'class-validator';

export class CreateClaimDto {

    @IsString()
    phoneNumber?: string | number;

    @IsString()
    amount?: string | number;

}

export class BulkOtpDto {
    @ApiProperty({
        type: [CreateClaimDto],
        description: 'Array of OTP requests',
        example: [
            {
                phoneNumber: '98670023857',
                amount: '1000'
            },
            {
                phoneNumber: '98670023858',
                amount: '2000'
            }
        ]
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateClaimDto)
    requests: CreateClaimDto[];
}

