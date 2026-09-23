import { ApiProperty } from '@nestjs/swagger';
import { OutboxEvent } from '../outbox-event.entity';
import type { PaginatedOutboxEvents } from '../outbox.service';

/** Page of outbox events that exhausted their dispatch attempts. */
export class OutboxDeadLetterListResponseDto implements PaginatedOutboxEvents {
  @ApiProperty({
    description: 'Dead-lettered outbox events, newest first',
    type: [OutboxEvent],
  })
  data: OutboxEvent[];

  @ApiProperty({
    description: 'Total number of dead-lettered events',
    example: 3,
  })
  total: number;

  @ApiProperty({ description: 'Page number (zero-indexed)', example: 0 })
  page: number;

  @ApiProperty({ description: 'Page size', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 1 })
  totalPages: number;
}
