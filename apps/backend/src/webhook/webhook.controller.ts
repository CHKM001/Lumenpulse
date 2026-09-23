import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiSecurity,
} from '@nestjs/swagger';
import { WEBHOOK_SIGNATURE_SECURITY_SCHEME } from '../openapi/openapi.constants';
import { WebhookService } from './webhook.service';
import { DataProcessingWebhookDto } from './dto/webhook-payload.dto';
import {
  WebhookVerificationGuard,
  WebhookProvider,
} from './webhook-verification.guard';

interface RawRequest {
  rawBody?: Buffer;
}

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('data-processing')
  @HttpCode(HttpStatus.OK)
  @UseGuards(WebhookVerificationGuard)
  @WebhookProvider('data-processing')
  @ApiOperation({
    summary: 'Receive data-processing intelligence events',
    description:
      'Accepts signed webhook payloads from the Python data-processing service. ' +
      'Verifies the HMAC-SHA256 signature in the X-Webhook-Signature header and ' +
      'converts the payload into an in-app Notification.',
  })
  @ApiSecurity(WEBHOOK_SIGNATURE_SECURITY_SCHEME)
  @ApiHeader({
    name: 'X-Webhook-Signature',
    description: 'HMAC-SHA256 signature — format: sha256=<hex>',
    required: true,
  })
  @ApiHeader({
    name: 'X-Webhook-Timestamp',
    description:
      'Delivery time as Unix epoch milliseconds; rejected if in the future or older than the tolerance window (default 5 minutes)',
    required: true,
    example: '1767225600000',
  })
  @ApiHeader({
    name: 'X-Webhook-Nonce',
    description:
      'Unique per-delivery identifier (UUID recommended); a nonce seen within the tolerance window is rejected as a replay',
    required: true,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook accepted and notification created',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        notificationId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Malformed or unsupported payload' })
  @ApiResponse({ status: 401, description: 'Invalid or missing signature' })
  async handleDataProcessing(
    @Req() req: RawRequest,
    @Headers('x-webhook-signature') signature: string,
    @Body() payload: DataProcessingWebhookDto,
  ): Promise<{ status: string; notificationId: string }> {
    if (!req.rawBody) {
      throw new BadRequestException('Empty request body');
    }

    // Signature is already verified by the guard
    const notification =
      await this.webhookService.handleDataProcessingEvent(payload);

    return { status: 'ok', notificationId: notification.id };
  }
}
