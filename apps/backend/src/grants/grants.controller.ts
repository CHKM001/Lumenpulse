import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { GrantsService } from './grants.service';
import { getProjectReadThrottleOverride } from '../common/rate-limit/rate-limit.config';
import {
  ApproveProjectDto,
  CreateRoundDto,
  FundPoolDto,
  RecordContributionDto,
  DistributeDto,
  RoundDto,
  RoundSummaryDto,
  RoundExportDto,
  LeaderboardQueryDto,
  LeaderboardResponseDto,
} from './dto/grants.dto';
import {
  DistributeResponseDto,
  FundPoolResponseDto,
  GrantsSuccessResponseDto,
} from './dto/grants-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';
import { UserRole } from '../users/entities/user.entity';
import { AuditBlockchainAction } from '../admin-audit/decorators/audit-blockchain-action.decorator';
import { AdminAuditInterceptor } from '../admin-audit/interceptors/admin-audit.interceptor';
import { JWT_SECURITY_SCHEME } from '../openapi/openapi.constants';

@ApiTags('grants')
@Controller('grants')
@Throttle(getProjectReadThrottleOverride())
export class GrantsController {
  constructor(private readonly grantsService: GrantsService) {}

  // ΓöÇΓöÇ Rounds ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

  @Get('rounds')
  @ApiOperation({
    summary: 'List all grant rounds',
    description:
      'Retrieves all available grant rounds (active, pending, finalized).',
  })
  @ApiResponse({
    status: 200,
    description: 'List of rounds retrieved successfully',
    type: [RoundDto],
  })
  listRounds() {
    return this.grantsService.listRounds();
  }

  @Get('rounds/:id')
  @ApiOperation({
    summary: 'Get details of a round',
    description:
      'Retrieves round details including token address and current pool balance.',
  })
  @ApiResponse({
    status: 200,
    description: 'Round details retrieved successfully',
    type: RoundDto,
  })
  @ApiResponse({ status: 404, description: 'Round not found' })
  getRound(@Param('id', ParseIntPipe) id: number) {
    return this.grantsService.getRound(id);
  }

  @Get('rounds/:id/summary')
  @ApiOperation({
    summary: 'Get round summary and allocations',
    description:
      'Retrieves a calculated summary of participation metrics and QF matching allocations.',
  })
  @ApiResponse({
    status: 200,
    description: 'Round summary retrieved successfully',
    type: RoundSummaryDto,
  })
  @ApiResponse({ status: 404, description: 'Round not found' })
  getRoundSummary(@Param('id', ParseIntPipe) id: number) {
    return this.grantsService.getRoundSummary(id);
  }

  @Get('rounds/:id/export')
  @ApiOperation({
    summary: 'Export round summary with detailed contributions list',
    description:
      'Retrieves a full export model of the round with all individual contributions listed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Round details exported successfully',
    type: RoundExportDto,
  })
  @ApiResponse({ status: 404, description: 'Round not found' })
  getRoundExport(@Param('id', ParseIntPipe) id: number) {
    return this.grantsService.getRoundExport(id);
  }

  @Post('rounds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth(JWT_SECURITY_SCHEME)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(AdminAuditInterceptor)
  @AuditBlockchainAction({ contractField: 'tokenAddress' })
  @ApiOperation({
    summary: 'Create a new grant round (admin only)',
    description:
      'Initializes a new grant round with start/end times and pool token. Requires admin role.',
  })
  @ApiResponse({
    status: 201,
    description: 'Round created successfully',
    type: RoundDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (admin only)' })
  createRound(@Body() dto: CreateRoundDto) {
    return this.grantsService.createRound(dto);
  }

  @Post('rounds/:id/finalize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth(JWT_SECURITY_SCHEME)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(AdminAuditInterceptor)
  @AuditBlockchainAction({ contractField: 'id' })
  @ApiOperation({
    summary: 'Finalize a grant round (admin only)',
    description:
      'Flags the round as finalized, calculating final matching pool allocations. Requires admin role.',
  })
  @ApiCreatedResponse({
    description: 'Round finalized successfully',
    type: RoundDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (admin only)' })
  @ApiResponse({ status: 404, description: 'Round not found' })
  finalizeRound(@Param('id', ParseIntPipe) id: number): RoundDto {
    return this.grantsService.finalizeRound(id);
  }

  // ΓöÇΓöÇ Pool funding ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

  @Post('rounds/fund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth(JWT_SECURITY_SCHEME)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(AdminAuditInterceptor)
  @AuditBlockchainAction({ contractField: 'funderPublicKey' })
  @ApiOperation({
    summary: 'Fund the matching pool (admin only)',
    description:
      'Records funding into the matching pool for a specific round. Requires admin role.',
  })
  @ApiCreatedResponse({
    description: 'Matching pool funded successfully',
    type: FundPoolResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (admin only)' })
  @ApiResponse({ status: 404, description: 'Round not found' })
  fundPool(@Body() dto: FundPoolDto): FundPoolResponseDto {
    return this.grantsService.fundPool(dto);
  }

  // ΓöÇΓöÇ Eligibility ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

  @Post('rounds/projects/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth(JWT_SECURITY_SCHEME)
  @Roles(UserRole.ADMIN, UserRole.REVIEWER)
  @UseInterceptors(AdminAuditInterceptor)
  @AuditBlockchainAction({ contractField: 'roundId' })
  @ApiOperation({
    summary: 'Approve a project for a round (admin/reviewer only)',
    description:
      'Approves project eligibility to receive match funding in the round. Requires admin or reviewer role.',
  })
  @ApiCreatedResponse({
    description: 'Project approved successfully',
    type: GrantsSuccessResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Round or project not found' })
  approveProject(@Body() dto: ApproveProjectDto): GrantsSuccessResponseDto {
    this.grantsService.approveProject(dto);
    return { success: true };
  }

  @Delete('rounds/:roundId/projects/:projectId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth(JWT_SECURITY_SCHEME)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(AdminAuditInterceptor)
  @AuditBlockchainAction({ contractField: 'roundId' })
  @ApiOperation({
    summary: 'Remove a project from a round (admin only)',
    description:
      'Removes project eligibility from a round. Requires admin role.',
  })
  @ApiOkResponse({
    description: 'Project removed successfully',
    type: GrantsSuccessResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (admin only)' })
  @ApiResponse({ status: 404, description: 'Round or project not found' })
  removeProject(
    @Param('roundId', ParseIntPipe) roundId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
  ): GrantsSuccessResponseDto {
    this.grantsService.removeProject(roundId, projectId);
    return { success: true };
  }

  // ΓöÇΓöÇ Contributions ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

  @Post('contributions')
  @ApiOperation({
    summary: 'Record a contribution transaction',
    description:
      'Records an on-chain contribution towards a project in a round.',
  })
  @ApiCreatedResponse({
    description: 'Contribution recorded successfully',
    type: GrantsSuccessResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid round or project' })
  recordContribution(
    @Body() dto: RecordContributionDto,
  ): GrantsSuccessResponseDto {
    this.grantsService.recordContribution(dto);
    return { success: true };
  }

  // ΓöÇΓöÇ Distribution ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ

  @Post('rounds/distribute')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth(JWT_SECURITY_SCHEME)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(AdminAuditInterceptor)
  @AuditBlockchainAction({ contractField: 'roundId' })
  @ApiOperation({
    summary: 'Distribute matching pool allocations (admin only)',
    description:
      'Distributes pool allocations to approved project owners. Requires admin role.',
  })
  @ApiCreatedResponse({
    description: 'Distribution completed successfully',
    type: DistributeResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (admin only)' })
  @ApiResponse({ status: 404, description: 'Round not found' })
  distribute(@Body() dto: DistributeDto): DistributeResponseDto {
    return this.grantsService.distribute(dto);
  }
  @Get('leaderboard')
  @ApiOperation({
    summary: 'Get leaderboard for a matching round',
    description:
      'Returns ranked projects for a round with contribution and match figures. ' +
      'Supports top-N (e.g. ?roundId=1&topN=5) or paginated responses ' +
      '(e.g. ?roundId=1&page=2&limit=10). Projects are ranked by QF score descending.',
  })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard retrieved successfully',
    type: LeaderboardResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Round not found' })
  getLeaderboard(@Query() query: LeaderboardQueryDto): LeaderboardResponseDto {
    return this.grantsService.getLeaderboard(query);
  }
}
