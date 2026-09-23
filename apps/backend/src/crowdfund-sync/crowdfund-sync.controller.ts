import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CrowdfundSyncService } from './crowdfund-sync.service';
import {
  SyncVaultDto,
  SyncVaultResponseDto,
  ListVaultEventsDto,
  DeadLetterListDto,
  DeadLetterStatsResponseDto,
  ReplayDeadLetterDto,
  ResolveDeadLetterDto,
  ReplayResponseDto,
  VaultSyncStatsDto,
} from './dto/crowdfund-sync.dto';
import {
  DeadLetterListResponseDto,
  RegisterVaultDto,
  ResolveDeadLetterResponseDto,
  VaultEventListResponseDto,
} from './dto/crowdfund-sync-response.dto';
import { CrowdfundVaultDeadLetter } from './entities/crowdfund-vault-dead-letter.entity';
import { CrowdfundVaultProject } from './entities/crowdfund-vault-project.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JWT_SECURITY_SCHEME } from '../openapi/openapi.constants';

@ApiTags('crowdfund-sync')
@ApiBearerAuth(JWT_SECURITY_SCHEME)
@Controller('crowdfund-sync')
@UseGuards(JwtAuthGuard)
export class CrowdfundSyncController {
  constructor(private readonly syncService: CrowdfundSyncService) {}

  /**
   * Sync a specific vault
   */
  @Post('sync')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Sync a crowdfund vault',
    description:
      'Fetches and processes vault events from the chain for the given ledger range (defaults to the stored cursor).',
  })
  @ApiAcceptedResponse({
    description: 'Sync run result',
    type: SyncVaultResponseDto,
  })
  async syncVault(@Body() dto: SyncVaultDto): Promise<SyncVaultResponseDto> {
    return this.syncService.syncVault(dto);
  }

  /**
   * List vault events
   */
  @Get('events')
  @ApiOperation({
    summary: 'List vault events',
    description: 'Paginated list of indexed crowdfund vault events.',
  })
  @ApiOkResponse({
    description: 'Page of vault events',
    type: VaultEventListResponseDto,
  })
  async listEvents(
    @Query() query: ListVaultEventsDto,
  ): Promise<VaultEventListResponseDto> {
    return this.syncService.listEvents(query);
  }

  /**
   * Get vault sync statistics
   */
  @Get('vaults/:vaultAddress/stats')
  @ApiOperation({ summary: 'Get vault sync statistics' })
  @ApiParam({ name: 'vaultAddress', description: 'Vault contract address' })
  @ApiOkResponse({
    description: 'Sync statistics for the vault',
    type: VaultSyncStatsDto,
  })
  async getVaultStats(
    @Param('vaultAddress') vaultAddress: string,
  ): Promise<VaultSyncStatsDto> {
    return this.syncService.getVaultStats(vaultAddress);
  }

  /**
   * Register a vault for syncing
   */
  @Post('vaults')
  @ApiOperation({
    summary: 'Register a vault for syncing',
    description: 'Creates or updates the vault-to-project mapping.',
  })
  @ApiCreatedResponse({
    description: 'Registered vault mapping',
    type: CrowdfundVaultProject,
  })
  async registerVault(
    @Body() body: RegisterVaultDto,
  ): Promise<CrowdfundVaultProject> {
    return this.syncService.registerVault(
      body.vaultAddress,
      body.projectId,
      body.contractAddress,
      body.tokenAddress,
      body.ownerAddress,
    );
  }

  /**
   * List dead letter queue entries
   */
  @Get('dead-letter')
  @ApiOperation({ summary: 'List dead-letter queue entries' })
  @ApiOkResponse({
    description: 'Page of dead-letter entries',
    type: DeadLetterListResponseDto,
  })
  async listDeadLetters(
    @Query() query: DeadLetterListDto,
  ): Promise<DeadLetterListResponseDto> {
    return this.syncService.listDeadLetters(query);
  }

  /**
   * Get dead letter statistics
   */
  @Get('dead-letter/stats')
  @ApiOperation({ summary: 'Get dead-letter queue statistics' })
  @ApiOkResponse({
    description: 'Dead-letter statistics',
    type: DeadLetterStatsResponseDto,
  })
  async getDeadLetterStats(): Promise<DeadLetterStatsResponseDto> {
    return this.syncService.getDeadLetterStats();
  }

  /**
   * Inspect a dead letter entry
   */
  @Get('dead-letter/:id')
  @ApiOperation({ summary: 'Inspect a dead-letter entry' })
  @ApiParam({ name: 'id', description: 'Dead-letter entry ID' })
  @ApiOkResponse({
    description: 'Dead-letter entry',
    type: CrowdfundVaultDeadLetter,
  })
  async inspectDeadLetter(
    @Param('id') id: string,
  ): Promise<CrowdfundVaultDeadLetter> {
    return this.syncService.inspectDeadLetter(id);
  }

  /**
   * Replay a dead letter event
   */
  @Post('dead-letter/:id/replay')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Replay a dead-letter event' })
  @ApiParam({ name: 'id', description: 'Dead-letter entry ID' })
  @ApiAcceptedResponse({
    description: 'Replay job queued',
    type: ReplayResponseDto,
  })
  async replayDeadLetter(
    @Param('id') id: string,
    @Body() body: ReplayDeadLetterDto,
  ): Promise<ReplayResponseDto> {
    return this.syncService.replayDeadLetter(id, body.reason);
  }

  /**
   * Resolve a dead letter entry
   */
  @Patch('dead-letter/:id/resolve')
  @ApiOperation({ summary: 'Mark a dead-letter entry as resolved' })
  @ApiParam({ name: 'id', description: 'Dead-letter entry ID' })
  @ApiOkResponse({
    description: 'Resolution result',
    type: ResolveDeadLetterResponseDto,
  })
  async resolveDeadLetter(
    @Param('id') id: string,
    @Body() body: ResolveDeadLetterDto,
  ): Promise<ResolveDeadLetterResponseDto> {
    return this.syncService.resolveDeadLetter(id, body.reason, body.resolvedBy);
  }
}
