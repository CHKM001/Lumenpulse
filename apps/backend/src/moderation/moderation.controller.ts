import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ModerationService } from './moderation.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { QueryReportsDto } from './dto/query-reports.dto';
import { AssignReviewerDto } from './dto/assign-reviewer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';
import { UserRole } from '../users/entities/user.entity';
import { JWT_SECURITY_SCHEME } from '../openapi/openapi.constants';
import { ContentReport } from './entities/content-report.entity';
import {
  ContentReportListResponseDto,
  ModerationStatsDto,
} from './dto/moderation-response.dto';

// Unified Authenticated Request Interface
interface RequestWithUser extends Request {
  user: {
    id: string;
    email?: string;
    role?: string;
  };
}

@ApiTags('moderation')
@ApiBearerAuth(JWT_SECURITY_SCHEME)
@Controller('moderation')
@UseGuards(JwtAuthGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  // ─── USER ENDPOINTS ───────────────────────────────────────────────────

  @Post('report')
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a content report' })
  @ApiCreatedResponse({
    description: 'Report successfully created',
    type: ContentReport,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - duplicate report or invalid data',
  })
  async createReport(
    @Req() req: RequestWithUser,
    @Body() createReportDto: CreateReportDto,
  ): Promise<ContentReport> {
    return this.moderationService.createReport(req.user.id, createReportDto);
  }

  @Get('my-reports')
  @ApiOperation({ summary: 'Get reports submitted by current user' })
  @ApiOkResponse({
    description: 'List of user reports',
    type: ContentReportListResponseDto,
  })
  async getMyReports(
    @Req() req: RequestWithUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<ContentReportListResponseDto> {
    return this.moderationService.getUserReports(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  // ─── ADMIN/MODERATOR ENDPOINTS ────────────────────────────────────────

  @Get('queue')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get moderation queue (Admin only)' })
  @ApiOkResponse({
    description: 'List of all reports with pagination',
    type: ContentReportListResponseDto,
  })
  async getModerationQueue(
    @Query() query: QueryReportsDto,
  ): Promise<ContentReportListResponseDto> {
    return this.moderationService.getReports(query);
  }

  @Get('queue/stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get moderation statistics (Admin only)' })
  @ApiOkResponse({
    description: 'Moderation queue statistics',
    type: ModerationStatsDto,
  })
  async getModerationStats(): Promise<ModerationStatsDto> {
    return this.moderationService.getModerationStats();
  }

  @Get('queue/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get specific report details (Admin only)' })
  @ApiOkResponse({ description: 'Report details', type: ContentReport })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async getReport(@Param('id') id: string): Promise<ContentReport> {
    return this.moderationService.getReportById(id);
  }

  @Patch('queue/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Update report status (Admin only)' })
  @ApiOkResponse({
    description: 'Report updated successfully',
    type: ContentReport,
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async updateReport(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateReportDto: UpdateReportDto,
  ): Promise<ContentReport> {
    return this.moderationService.updateReport(
      id,
      req.user.id,
      updateReportDto,
    );
  }

  @Patch('queue/:id/assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe())
  @ApiOperation({ summary: 'Assign a reviewer to a report (Admin only)' })
  @ApiOkResponse({
    description: 'Reviewer assigned successfully',
    type: ContentReport,
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  async assignReviewer(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() assignReviewerDto: AssignReviewerDto,
  ): Promise<ContentReport> {
    return this.moderationService.assignReviewer(
      id,
      req.user.id,
      assignReviewerDto.reviewerId,
    );
  }
}
