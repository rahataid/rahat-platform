import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class GetNotificationsDto {
    @ApiPropertyOptional({ example: "project-uuid", description: "Filter by project ID" })
    @IsString()
    @IsOptional()
    projectId?: string;

    @ApiPropertyOptional({ example: "activity", description: "Filter by group" })
    @IsString()
    @IsOptional()
    group?: string;

    @ApiPropertyOptional({ example: "Notification Title", description: "Filter by title" })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional({ example: "Some description", description: "Filter by description" })
    @IsString()
    @IsOptional()
    description?: string;
}