import { ApiProperty } from '@nestjs/swagger';
import { ContentReport } from '../entities/content-report.entity';

/** Page of content reports. `page` is 1-indexed. */
export class ContentReportListResponseDto {
  @ApiProperty({
    description: 'Content reports, newest first',
    type: [ContentReport],
  })
  reports: ContentReport[];

  @ApiProperty({ description: 'Total number of matching reports', example: 42 })
  total: number;

  @ApiProperty({ description: 'Current page (1-indexed)', example: 1 })
  page: number;

  @ApiProperty({ description: 'Page size', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 3 })
  totalPages: number;
}

/** Report counts per moderation status. */
export class ModerationStatsDto {
  @ApiProperty({ description: 'Total number of reports', example: 42 })
  totalReports: number;

  @ApiProperty({ description: 'Reports awaiting review', example: 10 })
  pendingReports: number;

  @ApiProperty({ description: 'Reports currently under review', example: 5 })
  underReviewReports: number;

  @ApiProperty({ description: 'Reports resolved', example: 20 })
  resolvedReports: number;

  @ApiProperty({ description: 'Reports dismissed', example: 7 })
  dismissedReports: number;
}
