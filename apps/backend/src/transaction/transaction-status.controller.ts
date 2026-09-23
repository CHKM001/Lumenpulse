import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { TransactionStatusService } from './transaction-status.service';
import { RegisterTransactionCallbackDto } from './dto/transaction-callback.dto';
import { ApiTags, ApiOperation, ApiAcceptedResponse } from '@nestjs/swagger';
import { TransactionCallbackRegisteredDto } from './dto/transaction-callback-response.dto';

@ApiTags('transaction-status')
@Controller('transactions/status')
export class TransactionStatusController {
  constructor(private readonly statusService: TransactionStatusService) {}

  @Post('callback')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Register a callback URL for transaction status updates',
  })
  @ApiAcceptedResponse({
    description: 'Callback registered successfully',
    type: TransactionCallbackRegisteredDto,
  })
  async registerCallback(
    @Body() dto: RegisterTransactionCallbackDto,
  ): Promise<TransactionCallbackRegisteredDto> {
    await this.statusService.registerCallback(dto);
    return { message: 'Callback registered successfully' };
  }
}
