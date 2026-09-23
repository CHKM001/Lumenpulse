import { ApiProperty } from '@nestjs/swagger';

/** Health of a single registered scheduled job. */
export class SchedulerJobStatusDto {
  @ApiProperty({ description: 'Job name', example: 'news-ingestion' })
  job: string;

  @ApiProperty({
    description: 'Human-readable job description',
    example: 'Fetches latest news articles',
  })
  description: string;

  @ApiProperty({
    description:
      'ISO timestamp of the most recent run start, or null if never run',
    type: String,
    nullable: true,
    example: '2026-01-01T00:00:00.000Z',
  })
  lastStart: string | null;

  @ApiProperty({
    description: 'ISO timestamp of the most recent successful run, or null',
    type: String,
    nullable: true,
    example: '2026-01-01T00:00:05.000Z',
  })
  lastSuccess: string | null;

  @ApiProperty({
    description: 'ISO timestamp of the most recent failed run, or null',
    type: String,
    nullable: true,
    example: null,
  })
  lastFailure: string | null;

  @ApiProperty({
    description: 'Duration in ms of the most recent completed run, or null',
    type: Number,
    nullable: true,
    example: 5000,
  })
  lastDurationMs: number | null;

  @ApiProperty({
    description: 'Expected maximum interval between successful runs (ms)',
    example: 3600000,
  })
  expectedIntervalMs: number;

  @ApiProperty({
    description:
      'True when the job has not succeeded within its expected interval',
    example: false,
  })
  stale: boolean;

  @ApiProperty({
    description: 'Machine-readable reason for staleness, or null when healthy',
    enum: ['never-succeeded', 'last-success-too-old'],
    nullable: true,
    example: null,
  })
  staleReason: 'never-succeeded' | 'last-success-too-old' | null;
}

/** Response of `GET /health/schedulers`. */
export class SchedulerHealthResponseDto {
  @ApiProperty({ enum: ['ok', 'error'], example: 'ok' })
  status: 'ok' | 'error';

  @ApiProperty({ enum: ['healthy', 'stale-jobs'], example: 'healthy' })
  summary: 'healthy' | 'stale-jobs';

  @ApiProperty({
    description: 'ISO timestamp of the check',
    example: '2026-01-01T00:00:00.000Z',
  })
  checkedAt: string;

  @ApiProperty({
    description: 'Jobs currently considered stale',
    type: [SchedulerJobStatusDto],
  })
  staleJobs: SchedulerJobStatusDto[];

  @ApiProperty({
    description: 'All registered jobs',
    type: [SchedulerJobStatusDto],
  })
  jobs: SchedulerJobStatusDto[];
}
