import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { VaultEventResponseDto } from './crowdfund-sync.dto';
import { CrowdfundVaultDeadLetter } from '../entities/crowdfund-vault-dead-letter.entity';

/** Request body for registering a vault for syncing. */
export class RegisterVaultDto {
  @ApiProperty({
    description: 'Stellar address of the crowdfund vault contract',
    example: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  })
  @IsString()
  vaultAddress!: string;

  @ApiProperty({
    description: 'Project the vault belongs to',
    example: 'proj_123',
  })
  @IsString()
  projectId!: string;

  @ApiPropertyOptional({
    description: 'Crowdfund contract address, if different from the vault',
  })
  @IsOptional()
  @IsString()
  contractAddress?: string;

  @ApiPropertyOptional({ description: 'Token contract address' })
  @IsOptional()
  @IsString()
  tokenAddress?: string;

  @ApiPropertyOptional({ description: 'Owner account address' })
  @IsOptional()
  @IsString()
  ownerAddress?: string;
}

/** Paginated list of vault events. */
export class VaultEventListResponseDto {
  @ApiProperty({
    description: 'Events on this page',
    type: [VaultEventResponseDto],
  })
  data!: VaultEventResponseDto[];

  @ApiProperty({ description: 'Zero-based page index', example: 0 })
  page!: number;

  @ApiProperty({ description: 'Page size', example: 20 })
  limit!: number;

  @ApiProperty({ description: 'Total number of matching events', example: 57 })
  total!: number;

  @ApiProperty({ description: 'Total number of pages', example: 3 })
  totalPages!: number;
}

/** Paginated list of dead-letter entries. */
export class DeadLetterListResponseDto {
  @ApiProperty({
    description: 'Dead-letter entries on this page',
    type: [CrowdfundVaultDeadLetter],
  })
  data!: CrowdfundVaultDeadLetter[];

  @ApiProperty({ description: 'Zero-based page index', example: 0 })
  page!: number;

  @ApiProperty({ description: 'Page size', example: 20 })
  limit!: number;

  @ApiProperty({ description: 'Total number of matching entries', example: 4 })
  total!: number;

  @ApiProperty({ description: 'Total number of pages', example: 1 })
  totalPages!: number;
}

/** Result of resolving a dead-letter entry. */
@ApiSchema({ name: 'CrowdfundSyncResolveDeadLetterResponseDto' })
export class ResolveDeadLetterResponseDto {
  @ApiProperty({
    description: 'Result message',
    example: 'Event marked as resolved',
  })
  message!: string;

  @ApiProperty({
    description: 'ID of the resolved dead-letter entry',
    example: '3f1c2d7e-8a4b-4c1e-9f0a-1b2c3d4e5f60',
  })
  eventId!: string;
}
