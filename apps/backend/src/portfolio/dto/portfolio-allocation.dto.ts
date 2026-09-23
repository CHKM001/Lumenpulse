import { ApiProperty } from '@nestjs/swagger';

/** Share of the portfolio held in a single asset. */
export class AssetAllocationItemDto {
  @ApiProperty({ description: 'Asset code', example: 'XLM' })
  assetCode: string;

  @ApiProperty({
    description: 'Asset issuer account, or null for the native asset',
    type: String,
    nullable: true,
    example: null,
  })
  assetIssuer: string | null;

  @ApiProperty({
    description: 'Aggregated balance across linked accounts',
    example: '1500.0000000',
  })
  amount: string;

  @ApiProperty({ description: 'Value in USD', example: 180.25 })
  valueUsd: number;

  @ApiProperty({
    description: 'Share of total portfolio value (0-100)',
    example: 62.5,
  })
  percentage: number;
}

/** Asset allocation breakdown for the authenticated user. */
export class PortfolioAllocationResponseDto {
  @ApiProperty({ description: 'Total portfolio value in USD', example: 288.4 })
  totalValueUsd: number;

  @ApiProperty({
    description: 'Per-asset allocation',
    type: [AssetAllocationItemDto],
  })
  allocation: AssetAllocationItemDto[];
}
