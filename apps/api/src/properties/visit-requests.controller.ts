import { Body, Controller, Get, NotFoundException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsDateString, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { PropertyAuthGuard } from './property-auth.guard';
import { VisitRequestsService } from './visit-requests.service';

type AuthenticatedRequest = { authUserId?: string };
class CreateVisitRequestDto {
  @IsDateString({ strict: true }) preferredDate!: string;
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) preferredTime!: string;
  @IsOptional() @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MaxLength(1000) message?: string;
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

  @Post(':propertyId')
  async create(@Req() request: AuthenticatedRequest, @Param('propertyId') propertyId: string, @Body() body: CreateVisitRequestDto) {
    if (!request.authUserId) throw new BadRequestException('Authenticated user identity is missing');
    const result = await this.service.create(request.authUserId, propertyId, body);
    if (!result) throw new NotFoundException('Published property not found');
    return result;
  }
}
