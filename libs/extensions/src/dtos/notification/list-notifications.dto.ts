import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString } from "class-validator";

export class ListNotificationsDto {
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

    @ApiPropertyOptional({ example: 1, description: "Page number" })
    @IsOptional()
    @IsInt()
    page?: number;

    @ApiPropertyOptional({ example: 20, description: "Items per page" })
    @IsOptional()
    @IsInt()
    perPage?: number;
}