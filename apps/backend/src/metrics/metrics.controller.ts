import {
  Controller,
  Get,
  UseGuards,
  Res,
  Query,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Response } from 'express';
import { MetricsService } from './metrics.service';
import { IpAllowlistGuard } from './ip-allowlist.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOkResponse,
  ApiProduces,
  ApiQuery,
} from '@nestjs/swagger';
import { MetricsHealthDto } from './dto/metrics-health.dto';

/** JSON shape returned by `getMetricsAsJson`: prom-client metrics keyed by name. */
const METRIC_JSON_SCHEMA = {
  type: 'object',
  description: 'Metrics keyed by metric name',
  additionalProperties: {
    type: 'object',
    properties: {
      name: { type: 'string', example: 'http_requests_total' },
      help: { type: 'string', example: 'Total number of HTTP requests' },
      type: {
        type: 'string',
        example: 'counter',
        description: 'counter | gauge | histogram | summary',
      },
      aggregator: { type: 'string', example: 'sum' },
      values: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            value: { type: 'number', example: 42 },
            labels: {
              type: 'object',
              additionalProperties: { type: 'string' },
            },
            metricName: { type: 'string' },
          },
        },
      },
    },
  },
};
import { ErrorCode } from '../common/enums/error-code.enum';

/**
 * Controller for exposing application metrics
 * Provides Prometheus-compatible metrics endpoint
 */
@ApiTags('metrics')
@Controller('metrics')
@UseGuards(IpAllowlistGuard)
export class MetricsController {
  private readonly logger = new Logger(MetricsController.name);

  constructor(private metricsService: MetricsService) {}

  /**
   * Get metrics in Prometheus text format
   * This is the standard endpoint for Prometheus scraping
   *
   * Access: Protected by IP allowlist or JWT authentication
   *
   * @example
   * curl http://localhost:3000/metrics
   * # HELP http_requests_total Total number of HTTP requests
   * # TYPE http_requests_total counter
   * http_requests_total{method="GET",route="/api/users",status="200"} 42
   */
  @Get()
  @ApiOperation({
    summary: 'Get application metrics in Prometheus format',
    description:
      'Returns metrics in Prometheus text format for scraping by monitoring tools like Prometheus',
  })
  @ApiQuery({
    name: 'format',
    required: false,
    enum: ['prometheus', 'json'],
    description: 'Output format (defaults to prometheus)',
  })
  @ApiProduces('text/plain', 'application/json')
  @ApiOkResponse({
    description:
      'Metrics in Prometheus format (text/plain; version=0.0.4), or JSON when format=json',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
          example:
            '# HELP http_requests_total Total number of HTTP requests\n# TYPE http_requests_total counter\nhttp_requests_total{method="GET",route="/api/users",status="200"} 42',
        },
      },
      'application/json': { schema: METRIC_JSON_SCHEMA },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - IP not in allowlist and no valid JWT',
  })
  async getMetrics(
    @Res() response: Response,
    @Query('format') format: 'prometheus' | 'json' = 'prometheus',
  ): Promise<void> {
    try {
      if (format === 'json') {
        const metricsJson = this.metricsService.getMetricsAsJson();
        response.json(metricsJson);
      } else {
        // Default: Prometheus format
        const metrics = await this.metricsService.getMetrics();
        response.set(
          'Content-Type',
          'text/plain; version=0.0.4; charset=utf-8',
        );
        response.send(metrics);
      }
    } catch (error) {
      this.logger.error('Error getting metrics:', error);
      throw new InternalServerErrorException({
        code: ErrorCode.SYS_INTERNAL_ERROR,
        message: 'Failed to retrieve metrics',
      });
    }
  }

  /**
   * Get metrics in JSON format
   * Useful for custom monitoring dashboards
   *
   * Access: Protected by IP allowlist or JWT authentication
   *
   * @example
   * curl http://localhost:3000/metrics/json
   * { "http_requests_total": { ... }, ... }
   */
  @Get('json')
  @ApiOperation({
    summary: 'Get application metrics in JSON format',
    description: 'Returns metrics as JSON for custom integrations',
  })
  @ApiOkResponse({
    description: 'Metrics in JSON format',
    schema: METRIC_JSON_SCHEMA,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - IP not in allowlist and no valid JWT',
  })
  getMetricsJson(@Res() response: Response): void {
    try {
      const metricsJson = this.metricsService.getMetricsAsJson();
      response.json(metricsJson);
    } catch (error) {
      this.logger.error('Error getting metrics:', error);
      throw new InternalServerErrorException({
        code: ErrorCode.SYS_INTERNAL_ERROR,
        message: 'Failed to retrieve metrics',
      });
    }
  }

  /**
   * Health check endpoint (unprotected info)
   * Returns basic health status of the application
   *
   * @example
   * curl http://localhost:3000/health
   * { "status": "ok", "timestamp": "2024-02-25T..." }
   */
  @Get('health')
  @ApiOperation({
    summary: 'Get health status',
    description: 'Returns the health status of the application',
  })
  @ApiOkResponse({
    description: 'Health status',
    type: MetricsHealthDto,
  })
  getHealth(): MetricsHealthDto {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
