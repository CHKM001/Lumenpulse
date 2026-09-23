import { ApiProperty } from '@nestjs/swagger';
import { ReviewComment } from '../entities/review-comment.entity';
import { ReviewDecisionHistory } from '../entities/review-decision-history.entity';

/** All review comments and decisions recorded for a single target. */
export class TargetReviewHistoryResponseDto {
  @ApiProperty({
    description:
      'Review comments on the target (internal comments are only included for admins)',
    type: [ReviewComment],
  })
  comments: ReviewComment[];

  @ApiProperty({
    description: 'Review decisions recorded for the target',
    type: [ReviewDecisionHistory],
  })
  decisions: ReviewDecisionHistory[];
}

/**
 * Page of review comments and decisions. Comments and decisions are paged
 * independently with the same `page`/`limit`.
 */
export class ReviewHistoryResponseDto extends TargetReviewHistoryResponseDto {
  @ApiProperty({
    description: 'Total number of matching comments plus decisions',
    example: 12,
  })
  total: number;

  @ApiProperty({ description: 'Current page (1-indexed)', example: 1 })
  page: number;

  @ApiProperty({ description: 'Page size', example: 20 })
  limit: number;

  @ApiProperty({
    description:
      'Total number of pages (based on the larger of the comment and decision counts)',
    example: 1,
  })
  totalPages: number;
}
