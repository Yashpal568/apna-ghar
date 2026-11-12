import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../properties/admin-auth.guard';
import { AdminService } from './admin.service';
import { AdminAuditService } from './admin-audit.service';
import {
  ListAdminPropertiesQueryDto,
  ListAuditLogsQueryDto,
  ListUsersQueryDto,
  ModeratePropertyStatusDto,
  ToggleCategoryDto,
  UpdateCategoryDto,
  UpdateUserStatusDto,
} from './dto/admin.dto';

type AuthenticatedRequest = { authUserId?: string; auth?: { userId: string } };

@Controller('admin')
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AdminAuditService,
  ) {}

  private getAdminId(request: AuthenticatedRequest): string {
    const adminId = request.authUserId || request.auth?.userId;
    if (!adminId) throw new BadRequestException('Authenticated admin identity is missing.');
    return adminId;
  }

  @Get('overview')
  getOverview() {
    return this.adminService.getOverviewMetrics();
  }

  @Get('users')
  listUsers(@Query() query: ListUsersQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Get('users/:userId')
  getUserDetails(@Param('userId') userId: string) {
    return this.adminService.getUserDetails(userId);
  }

  @Post('users/:userId/status')
  setUserStatus(
    @Req() request: AuthenticatedRequest,
    @Param('userId') userId: string,
    @Body() body: UpdateUserStatusDto,
  ) {
    return this.adminService.setUserStatus(this.getAdminId(request), userId, body);
  }

  @Get('properties')
  listProperties(@Query() query: ListAdminPropertiesQueryDto) {
    return this.adminService.listProperties(query);
  }

  @Get('properties/:propertyId')
  getPropertyDetails(@Param('propertyId') propertyId: string) {
    return this.adminService.getPropertyDetails(propertyId);
  }

  @Post('properties/:propertyId/status')
  moderateProperty(
    @Req() request: AuthenticatedRequest,
    @Param('propertyId') propertyId: string,
    @Body() body: ModeratePropertyStatusDto,
  ) {
    return this.adminService.moderateProperty(this.getAdminId(request), propertyId, body);
  }

  @Get('categories')
  listCategories() {
    return this.adminService.listCategories();
  }

  @Post('categories/:key/toggle')
  toggleCategory(
    @Req() request: AuthenticatedRequest,
    @Param('key') key: string,
    @Body() body: ToggleCategoryDto,
  ) {
    return this.adminService.toggleCategory(this.getAdminId(request), key, body.active);
  }

  @Patch('categories/:key')
  updateCategory(
    @Req() request: AuthenticatedRequest,
    @Param('key') key: string,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.adminService.updateCategory(this.getAdminId(request), key, body);
  }

  @Get('audit-logs')
  listAuditLogs(@Query() query: ListAuditLogsQueryDto) {
    return this.auditService.listLogs(query);
  }
}
