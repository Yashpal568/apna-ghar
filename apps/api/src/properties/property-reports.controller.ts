import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { PropertyAuthGuard } from './property-auth.guard';
import { PropertyReportsService } from './property-reports.service';
import { AdminAuthGuard } from './admin-auth.guard';

type AuthenticatedRequest = { authUserId?: string };
class CreatePropertyReportDto {
  @IsIn(['misleading', 'duplicate', 'scam', 'wrong_information', 'inappropriate', 'other']) reason!: string;
  @IsOptional() @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) @IsString() @MaxLength(1500) details?: string;
}

class ModeratePropertyReportDto {
  @IsIn(['open', 'reviewing', 'resolved', 'dismissed']) status!: 'open' | 'reviewing' | 'resolved' | 'dismissed';
}

@Controller('property-reports')
@UseGuards(PropertyAuthGuard)
export class PropertyReportsController {
  constructor(private readonly service: PropertyReportsService) {}

  @Get('admin')
  @UseGuards(AdminAuthGuard)
  listForModeration(@Req() request: AuthenticatedRequest, @Query('status') status?: string) {
    if (!request.authUserId) throw new BadRequestException('Authenticated admin identity is missing');
    return this.service.listForModeration(status);
  }

  @Post('admin/:reportId/status')
  @UseGuards(AdminAuthGuard)
  async moderate(@Req() request: AuthenticatedRequest, @Param('reportId') reportId: string, @Body() body: ModeratePropertyReportDto) {
    if (!request.authUserId) throw new BadRequestException('Authenticated admin identity is missing');
    const report = await this.service.moderate(reportId, body.status);
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  @Get()
  listMine(@Req() request: AuthenticatedRequest) {
    if (!request.authUserId) throw new BadRequestException('Authenticated user identity is missing');
    return this.service.listMine(request.authUserId);
  }

  @Post(':propertyId')
  async create(@Req() request: AuthenticatedRequest, @Param('propertyId') propertyId: string, @Body() body: CreatePropertyReportDto) {
    if (!request.authUserId) throw new BadRequestException('Authenticated user identity is missing');
    const report = await this.service.create(request.authUserId, propertyId, body.reason, body.details);
    if (!report) throw new NotFoundException('Published property not found or cannot be reported by this account');
    return report;
  }
}
