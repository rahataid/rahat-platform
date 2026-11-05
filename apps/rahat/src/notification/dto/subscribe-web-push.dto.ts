//rahat-platform/apps/rahat/src/notification/dto/subscribe-web-push.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

class PushKeysDto {
    @ApiProperty() @IsString() @IsNotEmpty() p256dh: string;
    @ApiProperty() @IsString() @IsNotEmpty() auth: string;
}

export class SubscribeWebPushDto {
    @ApiProperty() @IsString() @IsNotEmpty() endpoint: string;

    @ApiProperty({ type: PushKeysDto })
    @IsObject()
    @ValidateNested()
    @Type(() => PushKeysDto)
    keys: PushKeysDto;

    @ApiPropertyOptional() @IsOptional() @IsString() userAgent?: string;

    @ApiPropertyOptional() @IsOptional() user?: any; // attached server-side by sendCommand
}