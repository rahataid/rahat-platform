import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Platform-aggregated versions.
 * Note: `rahatUi` is OWNED by frontend (NEXT_PUBLIC_APP_VERSION) — included here as optional passthrough
 * for backwards compat, but frontend should prefer its own buildVersion.
 */
export class AppVersionsDto {
    /** Platform code version — readFile from rahat-platform/package.json:3 */
    @ApiProperty({ example: 'v1.8.0' })
    platform: string;

    /** AA code version — Redis action aa.jobs.version.get → aa/package.json:3. 'unreachable' if the RPC failed/timed out. */
    @ApiProperty({ example: 'v0.5.5-beta' })
    rahatAa: string;

    /** Triggers code version — Redis action ms.jobs.version.get → triggers/apps/triggers/package.json:3. 'unreachable' if the RPC failed/timed out. */
    @ApiProperty({ example: 'v3.1.2' })
    triggers: string;

    /** Runtime env */
    @ApiProperty({ example: 'dev', enum: ['dev', 'staging', 'prod', 'local'] })
    env: string;

    /** Optional: Rahat UI version passthrough (prefer frontend buildVersion) */
    @ApiPropertyOptional({ example: 'v2.4.1', description: 'Deprecated — frontend owns this via NEXT_PUBLIC_APP_VERSION' })
    rahatUi?: string;

    @ApiPropertyOptional({ example: 'abc1234' })
    commitSha?: string;

    @ApiPropertyOptional({ example: '2026-09-14T10:00:00.000Z' })
    fetchedAt?: string;
}

/** Issue #1283 — minimal */
export class WebVersionDto {
    @ApiProperty({ example: 'https://aa-dev.rahat.io' }) url: string;
    @ApiProperty({ example: 'dev' }) env: string;
}
