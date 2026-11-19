import { Body, BadRequestException, Controller, Get, NotFoundException, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { IsDateString, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { PropertyAuthGuard } from './property-auth.guard';
import { VisitRequestsService } from './visit-requests.service';
import { RateLimit } from '../common/decorators/rate-limit.decorator';

type AuthenticatedRequest = { authUserId?: string };

export class CreateVisitRequestDto {
  @IsDateString({ strict: true }) preferredDate!: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) preferredTime!: string;
  @IsOptional() @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MaxLength(1000) message?: string;
}

export class UpdateVisitRequestStatusDto {
  @IsOptional()
  @IsIn(['confirmed', 'declined', 'cancelled', 'accept', 'reject', 'confirm', 'decline', 'cancel', 'accepted', 'rejected'])
  status?: string;

  @IsOptional()
  @IsIn(['confirmed', 'declined', 'cancelled', 'accept', 'reject', 'confirm', 'decline', 'cancel', 'accepted', 'rejected'])
  action?: string;
}

@Controller('visit-requests')
@UseGuards(PropertyAuthGuard)
export class VisitRequestsController {
  constructor(private readonly service: VisitRequestsService) {}

  @Get()
  listMine(@Req() request: AuthenticatedRequest) {
    if (!request.authUserId) throw new BadRequestException('Authenticated user identity is missing');
    return this.service.listMine(request.authUserId);
  }

  @Get('received')
  listReceived(@Req() request: AuthenticatedRequest) {
    if (!request.authUserId) throw new BadRequestException('Authenticated user identity is missing');
    return this.service.listReceived(request.authUserId);
  }

  @Post(':propertyId')
  @RateLimit({ limit: 30, ttlSeconds: 60 })
  async create(@Req() request: AuthenticatedRequest, @Param('propertyId') propertyId: string, @Body() body: CreateVisitRequestDto) {
    if (!request.authUserId) throw new BadRequestException('Authenticated user identity is missing');
    const result = await this.service.create(request.authUserId, propertyId, body);
    if (!result) throw new NotFoundException('Published property not found');
    return result;
  }

  @Patch(':id/status')
  @RateLimit({ limit: 30, ttlSeconds: 60 })
  async updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateVisitRequestStatusDto,
  ) {
    if (!request.authUserId) throw new BadRequestException('Authenticated user identity is missing');
    const statusVal = body.status || body.action;
    if (!statusVal) throw new BadRequestException('Status or action is required');
    return this.service.updateStatus(request.authUserId, id, statusVal);
  }

  @Patch(':id/respond')
  @RateLimit({ limit: 30, ttlSeconds: 60 })
  async respond(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateVisitRequestStatusDto,
  ) {
    return this.updateStatus(request, id, body);
  }
}
