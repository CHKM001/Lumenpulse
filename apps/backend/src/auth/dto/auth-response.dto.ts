import { ApiProperty } from '@nestjs/swagger';

/** Generic `{ message }` acknowledgement returned by auth endpoints. */
export class AuthMessageResponseDto {
  @ApiProperty({
    description: 'Human-readable result message',
    example: 'Successfully logged out from all devices',
  })
  message: string;
}

/** Minimal user projection returned after Stellar wallet authentication. */
export class StellarAuthUserDto {
  @ApiProperty({
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'When the user account was created',
    example: '2026-01-15T10:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;
}

/** Result of verifying a signed Stellar challenge. */
export class VerifyChallengeResponseDto {
  @ApiProperty({
    description: 'Whether authentication succeeded',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  token: string;

  @ApiProperty({
    description: 'Refresh token for obtaining new access tokens',
    example: 'a1b2c3d4e5f6...',
  })
  refresh_token: string;

  @ApiProperty({
    description: 'Authenticated user',
    type: StellarAuthUserDto,
  })
  user: StellarAuthUserDto;
}
