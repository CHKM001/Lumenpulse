import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * A Horizon operation record as returned by
 * `GET /accounts/{publicKey}/operations`. Only the fields common to every
 * operation type are listed; type-specific fields (e.g. `amount`, `asset_code`,
 * `from`, `to` for payments) are passed through unchanged from Horizon.
 */
export class AccountOperationDto {
  @ApiProperty({
    description: 'Horizon operation ID',
    example: '123456789012345678',
  })
  id: string;

  @ApiProperty({
    description: 'Cursor for paging through Horizon results',
    example: '123456789012345678',
  })
  paging_token: string;

  @ApiProperty({
    description: 'Whether the containing transaction succeeded',
    example: true,
  })
  transaction_successful: boolean;

  @ApiProperty({
    description: 'Account that originated the operation',
    example: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
  })
  source_account: string;

  @ApiProperty({
    description: 'Operation type name',
    example: 'payment',
  })
  type: string;

  @ApiProperty({ description: 'Numeric operation type', example: 1 })
  type_i: number;

  @ApiProperty({
    description: 'When the operation was applied (ISO 8601)',
    example: '2026-01-01T00:00:00Z',
  })
  created_at: string;

  @ApiProperty({
    description: 'Hash of the containing transaction',
    example: 'a1b2c3d4e5f6...',
  })
  transaction_hash: string;

  @ApiPropertyOptional({
    description:
      'Horizon HAL links (self, transaction, effects, succeeds, precedes)',
    type: 'object',
    additionalProperties: {
      type: 'object',
      properties: {
        href: { type: 'string' },
        templated: { type: 'boolean' },
      },
    },
  })
  _links?: Record<string, { href: string; templated?: boolean }>;
}
