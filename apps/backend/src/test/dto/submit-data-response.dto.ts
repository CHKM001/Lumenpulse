import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Echo of a diagnostic payload submitted to `POST /test/submit`. */
export class SubmitDataResponseDto {
  @ApiProperty({
    description: 'Confirmation message',
    example: 'Data submitted successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Server time the payload was received',
    type: String,
    format: 'date-time',
    example: '2026-01-01T00:00:00.000Z',
  })
  timestamp: Date;

  @ApiPropertyOptional({
    description: 'The request body, echoed back unchanged',
    type: 'object',
    additionalProperties: true,
    example: { foo: 'bar' },
  })
  receivedData?: Record<string, unknown>;
}
