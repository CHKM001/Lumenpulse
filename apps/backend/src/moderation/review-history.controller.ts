import {
  Controller,
  Get,
  Post,
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
import { ReviewHistoryService } from './review-history.service';
import { CreateReviewCommentDto } from './dto/create-review-comment.dto';
import { CreateReviewDecisionDto } from './dto/create-review-decision.dto';
import { QueryReviewHistoryDto } from './dto/query-review-history.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/decorators/auth.decorators';
import { UserRole } from '../users/entities/user.entity';
import { JWT_SECURITY_SCHEME } from '../openapi/openapi.constants';
import { ReviewComment } from './entities/review-comment.entity';
import { ReviewDecisionHistory } from './entities/review-decision-history.entity';
import {
  ReviewHistoryResponseDto,
  TargetReviewHistoryResponseDto,
} from './dto/review-history-response.dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email?: string;
    role?: string;
  };
}

@ApiTags('review-history')
@ApiBearerAuth(JWT_SECURITY_SCHEME)
@Controller('review-history')
@UseGuards(JwtAuthGuard)
export class ReviewHistoryController {
  constructor(private readonly reviewHistoryService: ReviewHistoryService) {}

  @Post('comments')
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a review comment' })
  @ApiCreatedResponse({
    description: 'Comment successfully created',
    type: ReviewComment,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async createComment(
    @Req() req: RequestWithUser,
    @Body() createCommentDto: CreateReviewCommentDto,
  ): Promise<ReviewComment> {
    return this.reviewHistoryService.createComment(
      req.user.id,
      req.user.role as UserRole,
      createCommentDto,
    );
  }

  @Post('decisions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @UsePipes(new ValidationPipe())
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a review decision (Admin only)' })
  @ApiCreatedResponse({
    description: 'Decision successfully recorded',
    type: ReviewDecisionHistory,
  })
  @ApiResponse({ status: 403, description: 'Forbidden - admin only' })
  async createDecision(
    @Req() req: RequestWithUser,
    @Body() createDecisionDto: CreateReviewDecisionDto,
  ): Promise<ReviewDecisionHistory> {
    return this.reviewHistoryService.createDecision(
      req.user.id,
      req.user.role as UserRole,
      createDecisionDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get review history (comments and decisions)' })
  @ApiOkResponse({
    description: 'Review history retrieved successfully',
    type: ReviewHistoryResponseDto,
  })
  async getReviewHistory(
    @Req() req: RequestWithUser,
    @Query() query: QueryReviewHistoryDto,
  ): Promise<ReviewHistoryResponseDto> {
    return this.reviewHistoryService.getReviewHistory(
      query,
      req.user.role as UserRole,
    );
  }

  @Get('target/:targetType/:targetId')
  @ApiOperation({ summary: 'Get review history for a specific target' })
  @ApiOkResponse({
    description: 'Target review history retrieved successfully',
    type: TargetReviewHistoryResponseDto,
  })
  async getTargetReviewHistory(
    @Req() req: RequestWithUser,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
  ): Promise<TargetReviewHistoryResponseDto> {
    const [comments, decisions] = await Promise.all([
      this.reviewHistoryService.getCommentsByTarget(
        targetId,
        targetType,
        req.user.role as UserRole,
      ),
      this.reviewHistoryService.getDecisionsByTarget(targetId, targetType),
    ]);

    return {
      comments,
      decisions,
    };
  }

  @Get('comments/:id')
  @ApiOperation({ summary: 'Get a specific comment by ID' })
  @ApiOkResponse({
    description: 'Comment retrieved successfully',
    type: ReviewComment,
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({
    status: 403,
    description: 'Access denied to internal comment',
  })
  async getComment(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<ReviewComment> {
    return this.reviewHistoryService.getCommentById(
      id,
      req.user.role as UserRole,
    );
  }

  @Get('decisions/:id')
  @ApiOperation({ summary: 'Get a specific decision by ID' })
  @ApiOkResponse({
    description: 'Decision retrieved successfully',
    type: ReviewDecisionHistory,
  })
  @ApiResponse({ status: 404, description: 'Decision not found' })
  async getDecision(@Param('id') id: string): Promise<ReviewDecisionHistory> {
    return this.reviewHistoryService.getDecisionById(id);
  }
}
