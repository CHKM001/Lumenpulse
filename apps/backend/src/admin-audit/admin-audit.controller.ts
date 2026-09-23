import {
  Controller,
  Get,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminAuditService } from './admin-audit.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { AuditLogListResponseDto } from './dto/audit-log-list-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';
import { UserRole } from '../users/entities/user.entity';
import { JWT_SECURITY_SCHEME } from '../openapi/openapi.constants';

@ApiTags('admin-audit')
@ApiBearerAuth(JWT_SECURITY_SCHEME)
@Controller('admin/audit/blockchain')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminAuditController {
  constructor(private readonly auditService: AdminAuditService) {}

  /**
   * GET /admin/audit/blockchain
   * Query audit logs. Supports filtering by actorId, endpoint, and date range.
   */
  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({
    summary: 'Query admin blockchain-action audit logs',
    description:
      'Admin-only. Paginated audit trail of admin actions that touched on-chain contracts. Filter by actorId, endpoint and date range.',
  })
  @ApiOkResponse({
    description: 'Page of audit log entries',
    type: AuditLogListResponseDto,
  })
  async getLogs(
    @Query() query: QueryAuditLogsDto,
  ): Promise<AuditLogListResponseDto> {
    const { data, total } = await this.auditService.query({
      actorId: query.actorId,
      endpoint: query.endpoint,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      page: query.page,
      limit: query.limit,
    });

    return {
      data,
      meta: {
        total,
        page: query.page ?? 1,
        limit: query.limit ?? 20,
      },
    };
  }
}
