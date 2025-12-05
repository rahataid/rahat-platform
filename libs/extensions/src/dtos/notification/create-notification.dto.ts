import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateNotificationDto {
    @ApiProperty({
        example: 'New Project Created',
        description: 'Title of the notification',
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Project ID associated with the notification (optional)',
    })
    @IsString()
    @IsOptional()
    projectId?: string;

    @ApiProperty({
        example: 'A new project has been successfully created and is now available for beneficiary enrollment.',
        description: 'Detailed description of the notification',
    })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({
        example: 'project',
        description: 'Group category for the notification (e.g., project, beneficiary, transaction)',
    })
    @IsString()
    @IsNotEmpty()
    group: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Flag to send notification via any channel (email, etc). Optional. Default is false.'
    })
    @IsOptional()
    notify?: boolean;
}