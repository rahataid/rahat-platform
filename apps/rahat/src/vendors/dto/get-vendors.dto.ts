import { IsOptional, IsString } from "class-validator";

export class GetVendorsDTO {
    @IsString()
    @IsOptional()
    vendorName?: string;

    @IsString()
    @IsOptional()
    projectName?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsOptional()
    @IsString()
    page?: string;

    @IsOptional()
    @IsString()
    perPage?: string;
}