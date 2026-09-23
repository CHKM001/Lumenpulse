import { ApiProperty } from '@nestjs/swagger';

/** Acknowledgement returned when a transaction status callback is registered. */
export class TransactionCallbackRegisteredDto {
  @ApiProperty({
    description: 'Confirmation message',
    example: 'Callback registered successfully',
  })
  message: string;
}
