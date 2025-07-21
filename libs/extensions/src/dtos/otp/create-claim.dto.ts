import { IsString } from 'class-validator';

export class CreateClaimDto {

    @IsString()
    phoneNumber?: string | number;

    @IsString()
    amount?: string | number;

}

