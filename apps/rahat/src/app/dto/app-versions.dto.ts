import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Version and environment info for a single service.
export class ServiceVersionDto {
    @ApiProperty({ example: 'v1.8.0' })
    version: string;

    @ApiProperty({ example: 'development', nullable: true })
    env: string | null;
}

// Aggregated version info for all backend services.
export class AppVersionsDto {
    @ApiProperty({ type: ServiceVersionDto })
    platform: ServiceVersionDto;

    @ApiProperty({ type: ServiceVersionDto })
    rahatAa: ServiceVersionDto;

    @ApiProperty({ type: ServiceVersionDto })
    triggers: ServiceVersionDto;

    @ApiPropertyOptional({ example: 'v2.4.1' })
    rahatUi?: string;

    @ApiPropertyOptional({ example: 'abc1234' })
    commitSha?: string;

    @ApiPropertyOptional({ example: '2026-09-14T10:00:00.000Z' })
    fetchedAt?: string;
}

// Frontend URL and environment info.
export class WebVersionDto {
    @ApiProperty({ example: 'https://aa-dev.rahat.io' }) url: string;
    @ApiProperty({ example: 'dev', nullable: true }) env: string | null;
}

export class ProjectEnvironmentDto {
    @ApiProperty({ example: '73887c41-2d49-445b-85da-f86c65608a23' })
    projectId: string;

    @ApiProperty({ example: 'development', nullable: true })
    env: string | null;
}
