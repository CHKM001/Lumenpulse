import { ApiProperty } from '@nestjs/swagger';
import { AdminBlockchainAuditLog } from '../entities/admin-blockchain-audit-log.entity';

/** Pagination metadata for the audit log listing. */
export class AuditLogListMetaDto {
  @ApiProperty({
    description: 'Total number of matching log entries',
    example: 42,
  })
  total: number;

  @ApiProperty({ description: 'One-based page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Page size', example: 20 })
  limit: number;
}

/** Paginated admin blockchain-action audit log entries. */
export class AuditLogListResponseDto {
  @ApiProperty({
    description: 'Audit log entries on this page, newest first',
    type: [AdminBlockchainAuditLog],
  })
  data: AdminBlockchainAuditLog[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: AuditLogListMetaDto,
  })
  meta: AuditLogListMetaDto;
}
