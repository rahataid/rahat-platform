// rahat-project/libs/extensions/src/dtos/notification/create-notification.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type {
    NotificationAudience,
    NotificationAudienceSelector,
    NotificationPayload,
    NotificationPermission,
} from '@rahataid/sdk';
import { NotificationChannel } from '@rahataid/sdk/enums';
import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayUnique,
    IsArray,
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator';

export class NotificationPermissionDto implements NotificationPermission {
    @ApiProperty({ example: 'read' })
    @IsString()
    @IsNotEmpty()
    action: string;

    @ApiProperty({ example: 'Trigger' })
    @IsString()
    @IsNotEmpty()
    subject: string;
}

export class NotificationAudienceSelectorDto implements NotificationAudienceSelector {
    @ApiPropertyOptional({ type: [NotificationPermissionDto] })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @ValidateNested({ each: true })
    @Type(() => NotificationPermissionDto)
    permissions?: NotificationPermissionDto[];

    @ApiPropertyOptional({ example: ['Admin', 'Manager'] })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @IsString({ each: true })
    roles?: string[];

    @ApiPropertyOptional({ description: 'User UUIDs' })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(1000)
    @IsString({ each: true })
    userIds?: string[];

    @ApiPropertyOptional({ description: 'Everyone with a role scoped to projectId' })
    @IsOptional()
    @IsBoolean()
    projectMembers?: boolean;

    @ApiPropertyOptional({ description: 'Every active user' })
    @IsOptional()
    @IsBoolean()
    all?: boolean;
}

export class NotificationAudienceDto
    extends NotificationAudienceSelectorDto
    implements NotificationAudience {
    @ApiPropertyOptional({ type: NotificationAudienceSelectorDto, description: 'Removed from the result' })
    @IsOptional()
    @ValidateNested()
    @Type(() => NotificationAudienceSelectorDto)
    exclude?: NotificationAudienceSelectorDto;
}

export class CreateNotificationDto implements Omit<NotificationPayload, 'audience' | 'channels'> {
    @ApiProperty({ example: 'Trigger Statement Met for Karnali' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ example: 'The trigger condition has been met for phase ...' })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({ example: 'Trigger Statement' })
    @IsString()
    @IsNotEmpty()
    group: string;

    @ApiPropertyOptional({ description: 'Project UUID. Scopes role/permission matching to that project.' })
    @IsOptional()
    @IsString()
    projectId?: string;

    @ApiProperty({ type: NotificationAudienceDto })
    @IsOptional() // optional only so legacy senders keep working; the platform falls back to default roles
    @ValidateNested()
    @Type(() => NotificationAudienceDto)
    audience?: NotificationAudienceDto;

    @ApiProperty({ enum: NotificationChannel, isArray: true, example: ['PUSH', 'EMAIL'] })
    @IsOptional() // legacy senders: derived from `notify`
    @IsArray()
    @ArrayUnique()
    @IsEnum(NotificationChannel, { each: true })
    channels?: NotificationChannel[];

    /** @deprecated legacy senders only. New senders use `channels`. */
    @ApiPropertyOptional({ deprecated: true })
    @IsOptional()
    @IsBoolean()
    notify?: boolean;
}