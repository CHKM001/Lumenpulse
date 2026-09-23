import { ApiProperty } from '@nestjs/swagger';

/** Basic liveness payload returned by `GET /metrics/health`. */
export class MetricsHealthDto {
  @ApiProperty({ description: 'Health status', example: 'ok' })
  status: string;

  @ApiProperty({
    description: 'ISO timestamp of the check',
    example: '2026-01-01T00:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({ description: 'Process uptime in seconds', example: 1234.56 })
  uptime: number;
}
