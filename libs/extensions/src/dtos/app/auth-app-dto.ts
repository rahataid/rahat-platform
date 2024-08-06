import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAuthAppDto {
    @ApiProperty({ example: 'Community Tool' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'abc' })
    @IsString()
    publicKey: string;

    @ApiProperty({ example: 'This is app desc' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ example: 'e4eaaaf2-d142-11e1-b3e4-080027620cdd ' })
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
}

export class UpdateAuthAppDto extends PartialType(CreateAuthAppDto) { }