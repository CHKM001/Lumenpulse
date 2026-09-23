import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { WarmCachePreloaderService } from './warm-cache-preloader.service';
import { WarmCacheReport } from './warm-cache.registry';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';
import { UserRole } from '../users/entities/user.entity';
import { JWT_SECURITY_SCHEME } from '../openapi/openapi.constants';
import {
  ForceRefreshDto,
  WarmCacheReportDto,
  WarmCacheStatusDto,
} from './dto/warm-cache.dto';

@ApiTags('cache')
@Controller('cache')
export class WarmCacheController {
  private readonly logger = new Logger(WarmCacheController.name);

  constructor(private readonly preloaderService: WarmCachePreloaderService) {}

  /**
   * POST /cache/warm
   *
   * Immediately preloads all registered hot-cache routes.
   * Restricted to ADMIN role.
   */
  @Post('warm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth(JWT_SECURITY_SCHEME)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Manually trigger a warm-cache preload cycle',
    description:
      'Preloads all registered hot-cache routes immediately. ' +
      'Skips if Redis is unhealthy. Restricted to ADMIN role.',
  })
  @ApiBody({ type: ForceRefreshDto, required: false })
  @ApiOkResponse({
    description: 'Warm-cache refresh report.',
    type: WarmCacheReportDto,
  })
  async forceRefresh(@Body() dto?: ForceRefreshDto): Promise<WarmCacheReport> {
    this.logger.log(
      `Manual cache warm triggered by: ${dto?.requestedBy ?? 'unknown'}`,
    );
    return this.preloaderService.forceRefresh(dto?.requestedBy);
  }

  /**
   * GET /cache/warm/status
   *
   * Returns the most recent warm-cache refresh report without triggering a new cycle.
   * Restricted to ADMIN role.
   */
  @Get('warm/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth(JWT_SECURITY_SCHEME)
  @ApiOperation({
    summary: 'Get the last warm-cache refresh report',
    description:
      'Returns the result of the most recently completed preload cycle, ' +
      'or null if no cycle has run yet.',
  })
  @ApiOkResponse({
    description: 'Last warm-cache report (or null if never run).',
    type: WarmCacheStatusDto,
  })
  getStatus(): WarmCacheStatusDto {
    return {
      lastRunAt: this.preloaderService.getLastRunAt(),
      report: this.preloaderService.getLastReport(),
    };
  }
}
