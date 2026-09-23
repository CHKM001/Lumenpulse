import { ApiProperty } from '@nestjs/swagger';

/** Acknowledgement returned by grant write endpoints that have no other payload. */
export class GrantsSuccessResponseDto {
  @ApiProperty({
    description: 'Always true when the operation succeeded',
    example: true,
  })
  success: boolean;
}

/** Result of funding a round's matching pool. */
export class FundPoolResponseDto {
  @ApiProperty({ description: 'ID of the funded round', example: 1 })
  roundId: number;

  @ApiProperty({
    description: 'Matching pool balance after funding (stroops, as string)',
    example: '1500000000',
  })
  newBalance: string;
}

/** A single matching-pool payout to a project owner. */
export class DistributionAllocationDto {
  @ApiProperty({ description: 'Project ID', example: 42 })
  projectId: number;

  @ApiProperty({
    description: 'Stellar public key of the project owner receiving funds',
    example: 'G...OWNER',
  })
  owner: string;

  @ApiProperty({
    description: 'Allocated amount (stroops, as string)',
    example: '750000000',
  })
  amount: string;
}

/** Result of distributing a finalized round's matching pool. */
export class DistributeResponseDto {
  @ApiProperty({
    description: 'Total amount distributed across all projects',
    example: '1500000000',
  })
  totalDistributed: string;

  @ApiProperty({
    description: 'Per-project allocations',
    type: [DistributionAllocationDto],
  })
  allocations: DistributionAllocationDto[];
}
