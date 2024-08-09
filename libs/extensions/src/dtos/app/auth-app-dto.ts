import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAuthAppDto {
    @ApiProperty({ example: 'Community Tool' })
    @IsString()
    name: string;

    @ApiProperty({ example: '0x0afe4eaaaf2080027620cdd' })
    @IsString()
    address: string;

    @ApiProperty({ example: 'This is app desc' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 'HelloWorld' })
    @IsString()
    @IsOptional()
    nonceMessage?: string;

    @ApiProperty({ example: 'e4eaaaf2-d142-11e1-b3e4-080027620cdd' })
    @IsString()
    @IsOptional()
    createdBy?: string;
}

export class ListAuthAppsDto {
    @ApiPropertyOptional({ example: 'Community Tool' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ example: 1 })
    @IsNumber()
    page: number;

    @ApiProperty({ example: '10' })
    @IsNumber()
    perPage: number;

    @ApiPropertyOptional({ example: "1" })
    @IsString()
    @IsOptional()
    sort: string;

    @ApiPropertyOptional({ example: "desc" })
    @IsString()
    @IsOptional()
    order: 'asc' | 'desc';
}

export class UpdateAuthAppDto extends PartialType(CreateAuthAppDto) { }