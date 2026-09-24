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
