import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { WEBHOOK_SIGNATURE_SECURITY_SCHEME } from '../openapi/openapi.constants';
import { Request } from 'express';
import { IngestSorobanEventDto } from './dto/ingest-soroban-event.dto';
import { IngestSorobanEventResponseDto } from './dto/ingest-soroban-event-response.dto';
import { SorobanEventsService } from './soroban-events.service';
import { SorobanEventIngestionGuard } from './guards/soroban-event-ingestion.guard';
import {
  SOROBAN_NONCE_HEADER,
  SOROBAN_SIGNATURE_HEADER,
  SOROBAN_TIMESTAMP_HEADER,
  VerifiedWebhookRequest,
} from './interfaces/soroban-webhook.interface';

type RequestWithVerification = Request & {
  requestId?: string;
  verifiedWebhook?: VerifiedWebhookRequest;
};

@ApiTags('soroban-events')
@Controller('soroban-events')
export class SorobanEventsController {
  private readonly logger = new Logger(SorobanEventsController.name);

  constructor(private readonly service: SorobanEventsService) {}

  @Post('ingest')
  @UseGuards(SorobanEventIngestionGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Ingest a Soroban contract event',
    description:
      'Accepts Soroban events from the indexer or cron service for processing. ' +
      'Events are queued asynchronously and their status can be checked via the returned event ID. ' +
      'Requests must be HMAC-SHA256 signed with SOROBAN_INGEST_SECRET over `${timestamp}.${nonce}.${rawBody}` ' +
      '(hex digest in the signature header); the timestamp must be within the configured tolerance (default 5 minutes).',
  })
  @ApiSecurity(WEBHOOK_SIGNATURE_SECURITY_SCHEME)
  @ApiHeader({
    name: SOROBAN_SIGNATURE_HEADER,
    description:
      'Hex-encoded HMAC-SHA256 of `${timestamp}.${nonce}.${rawBody}` keyed with SOROBAN_INGEST_SECRET',
    required: true,
  })
  @ApiHeader({
    name: SOROBAN_TIMESTAMP_HEADER,
    description:
      'Unix epoch milliseconds when the request was signed; rejected if in the future or older than the tolerance window',
    example: '1732000000000',
    required: true,
  })
  @ApiHeader({
    name: SOROBAN_NONCE_HEADER,
    description: 'Unique per-request nonce included in the signed payload',
    example: '9b2f7c4e-1d3a-4e8b-a6f0-2c5d7e9f1a3b',
    required: true,
  })
  @ApiBody({
    description: 'Soroban event details to ingest for processing',
    type: IngestSorobanEventDto,
  })
  @ApiResponse({
    status: 202,
    description:
      'Event accepted for processing. ' +
      'The system returns immediately with event details. ' +
      'Processing happens asynchronously - check the status field for current state.',
    type: IngestSorobanEventResponseDto,
  })
  @ApiResponse({
    status: 401,
    description:
      'Unauthorized - Missing or invalid signature, timestamp or nonce header',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - Invalid event data (missing txHash, invalid eventIndex, etc.)',
  })
  async ingest(
    @Req() req: RequestWithVerification,
    @Body() dto: IngestSorobanEventDto,
  ) {
    const requestId = req.requestId ?? 'unknown';

    this.logger.log(
      { requestId, txHash: dto.txHash, eventIndex: dto.eventIndex },
      'Ingesting soroban event',
    );

    return this.service.ingest(dto, requestId);
  }
}
