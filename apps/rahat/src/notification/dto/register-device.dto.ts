import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDeviceDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    token: string;

    // mobile only: web is intentionally not allowed
    @ApiProperty({ enum: ['android', 'ios'] })
    @IsIn(['android', 'ios'])
    platform: 'android' | 'ios';

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    appId?: string;
}