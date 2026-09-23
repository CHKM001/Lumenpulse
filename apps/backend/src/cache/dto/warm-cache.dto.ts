import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/** Optional body for a manual warm-cache refresh. */
export class ForceRefreshDto {
  @ApiPropertyOptional({
    description: 'Optional identifier recorded in audit logs.',
    example: 'ops@lumenpulse.io',
  })
  @IsOptional()
  @IsString()
  requestedBy?: string;
}

/** Result of a single route preload attempt. */
export class PreloadResultDto {
  @ApiProperty({ description: 'Route name', example: 'news:latest' })
  route: string;

  @ApiProperty({ description: 'Cache key written', example: 'news:latest' })
  cacheKey: string;

  @ApiProperty({ description: 'Whether the preload succeeded', example: true })
  success: boolean;

  @ApiProperty({ description: 'Preload duration in ms', example: 42 })
  durationMs: number;

  @ApiPropertyOptional({ description: 'Error message when the preload failed' })
  error?: string;
}

/** Aggregated output of a full warm-cache refresh cycle. */
export class WarmCacheReportDto {
  @ApiProperty({
    description: 'ISO timestamp when the cycle was triggered',
    example: '2026-01-01T00:00:00.000Z',
  })
  triggeredAt: string;

  @ApiProperty({ description: 'Number of registered routes', example: 5 })
  totalRoutes: number;

  @ApiProperty({ description: 'Routes preloaded successfully', example: 5 })
  succeeded: number;

  @ApiProperty({ description: 'Routes that failed to preload', example: 0 })
  failed: number;

  @ApiProperty({
    description: 'Routes skipped (e.g. Redis unhealthy)',
    example: 0,
  })
  skipped: number;

  @ApiProperty({ description: 'Total cycle duration in ms', example: 120 })
  durationMs: number;

  @ApiProperty({ description: 'Per-route results', type: [PreloadResultDto] })
  results: PreloadResultDto[];
}

/** Last warm-cache run status. */
export class WarmCacheStatusDto {
  @ApiProperty({
    description:
      'ISO timestamp of the last completed cycle, or null if never run',
    type: String,
    nullable: true,
    example: '2026-01-01T00:00:00.000Z',
  })
  lastRunAt: string | null;

  @ApiProperty({
    description: 'Last refresh report, or null if never run',
    type: WarmCacheReportDto,
    nullable: true,
  })
  report: WarmCacheReportDto | null;
}
